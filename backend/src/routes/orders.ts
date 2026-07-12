import { Router } from "express";
import { randomUUID } from "crypto";
import { db, productsTable, vendorsTable, ordersTable, orderItemsTable, couponsTable, siteSettingsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { optionalCustomer } from "../lib/auth";

const router = Router();

const DEFAULT_COMMISSION_RATE = 10; // percent, used when no platform setting or vendor override exists

async function getPlatformCommissionRate(): Promise<number> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "commission_rate"));
  const parsed = row ? Number(row.value) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_COMMISSION_RATE;
}

interface CartLine {
  productId: string;
  quantity: number;
}

router.post("/orders", optionalCustomer, async (req, res) => {
  try {
    const { items, customerName, customerPhone, customerAddress, couponCode } = req.body as {
      items?: CartLine[];
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
      couponCode?: string;
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }
    if (!customerName || !customerPhone) {
      res.status(400).json({ error: "customerName and customerPhone are required" });
      return;
    }

    const productIds = items.map((i) => i.productId);
    const products = await db.select().from(productsTable).where(inArray(productsTable.id, productIds));

    if (products.length !== new Set(productIds).size) {
      res.status(400).json({ error: "One or more products could not be found" });
      return;
    }

    const vendorIds = [...new Set(products.map((p) => p.vendorId))];
    const vendors = await db.select().from(vendorsTable).where(inArray(vendorsTable.id, vendorIds));
    const vendorById = new Map(vendors.map((v) => [v.id, v]));
    const platformRate = await getPlatformCommissionRate();

    let coupon: typeof couponsTable.$inferSelect | undefined;
    if (couponCode) {
      const [row] = await db.select().from(couponsTable).where(eq(couponsTable.code, couponCode.toUpperCase()));
      if (!row || !row.active || (row.expiresAt && new Date(row.expiresAt) < new Date())) {
        res.status(400).json({ error: "Invalid or expired coupon code" });
        return;
      }
      if (row.vendorId && !vendorIds.includes(row.vendorId)) {
        res.status(400).json({ error: "This coupon does not apply to items in your cart" });
        return;
      }
      coupon = row;
    }

    let subtotal = 0;
    const lineItems: {
      productId: string;
      vendorId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      commissionRate: number;
      commissionAmount: number;
    }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (item.quantity < 1) {
        res.status(400).json({ error: `Invalid quantity for ${product.name}` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ error: `Not enough stock for ${product.name}` });
        return;
      }
      const unitPrice = product.salePrice ?? product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      const vendor = vendorById.get(product.vendorId);
      const commissionRate = vendor?.commissionRate ?? platformRate;
      const applyLineDiscount = coupon && (!coupon.vendorId || coupon.vendorId === product.vendorId);
      const lineAfterDiscount = applyLineDiscount
        ? coupon!.discountType === "percent"
          ? lineTotal * (1 - coupon!.discountValue / 100)
          : Math.max(0, lineTotal - coupon!.discountValue)
        : lineTotal;
      const commissionAmount = (lineAfterDiscount * commissionRate) / 100;

      lineItems.push({
        productId: product.id,
        vendorId: product.vendorId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        commissionRate,
        commissionAmount,
      });
    }

    const discountTotal = coupon
      ? lineItems.reduce((sum, li) => {
          const applies = !coupon!.vendorId || coupon!.vendorId === li.vendorId;
          if (!applies) return sum;
          return (
            sum +
            (coupon!.discountType === "percent" ? li.lineTotal * (coupon!.discountValue / 100) : Math.min(li.lineTotal, coupon!.discountValue))
          );
        }, 0)
      : 0;

    const total = Math.max(0, subtotal - discountTotal);
    const commissionTotal = lineItems.reduce((sum, li) => sum + li.commissionAmount, 0);

    const orderId = randomUUID();
    const [order] = await db
      .insert(ordersTable)
      .values({
        id: orderId,
        customerId: req.customerId ?? null,
        customerName,
        customerPhone,
        customerAddress: customerAddress ?? null,
        status: "pending",
        subtotal,
        discountTotal,
        commissionTotal,
        total,
        couponCode: coupon?.code ?? null,
      })
      .returning();

    await db.insert(orderItemsTable).values(
      lineItems.map((li) => ({
        id: randomUUID(),
        orderId,
        productId: li.productId,
        vendorId: li.vendorId,
        productName: li.productName,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        lineTotal: li.lineTotal,
        commissionRate: li.commissionRate,
        commissionAmount: li.commissionAmount,
      })),
    );

    for (const item of items) {
      await db
        .update(productsTable)
        .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));
    }

    res.status(201).json({ ...order, items: lineItems });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, req.params.id as string));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    res.json({ ...order, items });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;
