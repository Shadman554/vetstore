import { Router } from "express";
import { randomUUID } from "crypto";
import { db, productsTable, orderItemsTable, ordersTable, couponsTable, vendorsTable } from "@workspace/db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { requireVendor } from "../lib/auth";
import { makeUniqueSlug } from "../lib/slug";

const router = Router();

// ---------------------------------------------------------------------------
// Product management (scoped to the logged-in vendor)
// ---------------------------------------------------------------------------
router.get("/vendors/me/products", requireVendor, async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.vendorId, req.vendorId as string))
      .orderBy(desc(productsTable.createdAt));
    res.json(products);
  } catch (err) {
    console.error("Error fetching vendor products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/vendors/me/products", requireVendor, async (req, res) => {
  try {
    const body = req.body as {
      name: string;
      description?: string;
      ingredients?: string;
      images?: string[];
      sku?: string;
      barcode?: string;
      brand?: string;
      categoryId?: string;
      species?: string;
      price: number;
      salePrice?: number;
      stock?: number;
      weight?: string;
      expirationDate?: string;
    };

    if (!body.name || typeof body.price !== "number") {
      res.status(400).json({ error: "name and price are required" });
      return;
    }

    const slug = await makeUniqueSlug(body.name, async (candidate) => {
      const [row] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.slug, candidate));
      return !!row;
    });

    const [product] = await db
      .insert(productsTable)
      .values({
        id: randomUUID(),
        vendorId: req.vendorId as string,
        slug,
        sku: body.sku ?? null,
        barcode: body.barcode ?? null,
        brand: body.brand ?? null,
        categoryId: body.categoryId ?? null,
        species: body.species ?? null,
        name: body.name,
        description: body.description ?? null,
        ingredients: body.ingredients ?? null,
        images: body.images && body.images.length > 0 ? body.images : null,
        price: body.price,
        salePrice: body.salePrice ?? null,
        stock: body.stock ?? 0,
        weight: body.weight ?? null,
        expirationDate: body.expirationDate ?? null,
        status: "active",
      })
      .returning();

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/vendors/me/products/:id", requireVendor, async (req, res) => {
  try {
    const body = req.body as Partial<{
      name: string;
      description: string;
      ingredients: string;
      images: string[];
      sku: string;
      barcode: string;
      brand: string;
      categoryId: string | null;
      species: string | null;
      price: number;
      salePrice: number | null;
      stock: number;
      weight: string;
      expirationDate: string | null;
      status: string;
    }>;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "name",
      "description",
      "ingredients",
      "sku",
      "barcode",
      "brand",
      "categoryId",
      "species",
      "price",
      "salePrice",
      "stock",
      "weight",
      "expirationDate",
      "status",
    ] as const) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.images !== undefined) updates.images = body.images.length > 0 ? body.images : null;

    const [product] = await db
      .update(productsTable)
      .set(updates)
      .where(and(eq(productsTable.id, req.params.id as string), eq(productsTable.vendorId, req.vendorId as string)))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/vendors/me/products/:id", requireVendor, async (req, res) => {
  try {
    const [product] = await db
      .delete(productsTable)
      .where(and(eq(productsTable.id, req.params.id as string), eq(productsTable.vendorId, req.vendorId as string)))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ---------------------------------------------------------------------------
// Orders containing this vendor's products
// ---------------------------------------------------------------------------
router.get("/vendors/me/orders", requireVendor, async (req, res) => {
  try {
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.vendorId, req.vendorId as string))
      .orderBy(desc(orderItemsTable.id));

    if (items.length === 0) {
      res.json([]);
      return;
    }
    const orderIds = [...new Set(items.map((i) => i.orderId))];
    const orders = await db.select().from(ordersTable).where(inArray(ordersTable.id, orderIds));
    const orderById = new Map(orders.map((o) => [o.id, o]));

    res.json(
      orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((order) => ({
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          status: order.status,
          createdAt: order.createdAt,
          items: items.filter((i) => i.orderId === order.id),
        })),
    );
  } catch (err) {
    console.error("Error fetching vendor orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.put("/vendors/me/orders/:id/status", requireVendor, async (req, res) => {
  try {
    const { status } = req.body as { status?: string };
    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
      return;
    }
    const [ownsOrder] = await db
      .select({ id: orderItemsTable.id })
      .from(orderItemsTable)
      .where(and(eq(orderItemsTable.orderId, req.params.id as string), eq(orderItemsTable.vendorId, req.vendorId as string)));
    if (!ownsOrder) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, req.params.id as string)).returning();
    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
router.get("/vendors/me/coupons", requireVendor, async (req, res) => {
  const coupons = await db.select().from(couponsTable).where(eq(couponsTable.vendorId, req.vendorId as string));
  res.json(coupons);
});

router.post("/vendors/me/coupons", requireVendor, async (req, res) => {
  try {
    const { code, discountType, discountValue, expiresAt } = req.body as {
      code?: string;
      discountType?: string;
      discountValue?: number;
      expiresAt?: string;
    };
    if (!code || !discountType || typeof discountValue !== "number") {
      res.status(400).json({ error: "code, discountType and discountValue are required" });
      return;
    }
    if (!["percent", "fixed"].includes(discountType)) {
      res.status(400).json({ error: "discountType must be percent or fixed" });
      return;
    }
    const [coupon] = await db
      .insert(couponsTable)
      .values({
        id: randomUUID(),
        vendorId: req.vendorId as string,
        code: code.toUpperCase(),
        discountType,
        discountValue,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      })
      .returning();
    res.status(201).json(coupon);
  } catch (err) {
    console.error("Error creating coupon:", err);
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

router.put("/vendors/me/coupons/:id", requireVendor, async (req, res) => {
  try {
    const { active, discountValue, expiresAt } = req.body as { active?: boolean; discountValue?: number; expiresAt?: string | null };
    const updates: Record<string, unknown> = {};
    if (active !== undefined) updates.active = active;
    if (discountValue !== undefined) updates.discountValue = discountValue;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const [coupon] = await db
      .update(couponsTable)
      .set(updates)
      .where(and(eq(couponsTable.id, req.params.id as string), eq(couponsTable.vendorId, req.vendorId as string)))
      .returning();
    if (!coupon) {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }
    res.json(coupon);
  } catch (err) {
    console.error("Error updating coupon:", err);
    res.status(500).json({ error: "Failed to update coupon" });
  }
});

router.delete("/vendors/me/coupons/:id", requireVendor, async (req, res) => {
  try {
    await db.delete(couponsTable).where(and(eq(couponsTable.id, req.params.id as string), eq(couponsTable.vendorId, req.vendorId as string)));
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting coupon:", err);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
router.get("/vendors/me/analytics", requireVendor, async (req, res) => {
  try {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.vendorId, req.vendorId as string));
    const [productStats] = await db
      .select({ total: sql<number>`count(*)`, active: sql<number>`count(*) filter (where ${productsTable.status} = 'active')` })
      .from(productsTable)
      .where(eq(productsTable.vendorId, req.vendorId as string));

    const revenue = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const commissionPaid = items.reduce((sum, i) => sum + i.commissionAmount, 0);
    const unitsSold = items.reduce((sum, i) => sum + i.quantity, 0);

    res.json({
      revenue,
      netRevenue: revenue - commissionPaid,
      commissionPaid,
      unitsSold,
      orderLineCount: items.length,
      totalProducts: Number(productStats?.total ?? 0),
      activeProducts: Number(productStats?.active ?? 0),
    });
  } catch (err) {
    console.error("Error fetching vendor analytics:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
