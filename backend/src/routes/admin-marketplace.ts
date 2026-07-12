import { Router } from "express";
import { db, vendorsTable, productsTable, ordersTable, orderItemsTable, siteSettingsTable } from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { randomUUID } from "crypto";
import { makeUniqueSlug } from "../lib/slug";

const router = Router();

function publicVendor(v: typeof vendorsTable.$inferSelect) {
  const { passwordHash, ...rest } = v;
  return rest;
}

// ---------------------------------------------------------------------------
// Vendor approval & commission
// ---------------------------------------------------------------------------
router.get("/admin/vendors", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    const vendors = status
      ? await db.select().from(vendorsTable).where(eq(vendorsTable.status, status)).orderBy(desc(vendorsTable.createdAt))
      : await db.select().from(vendorsTable).orderBy(desc(vendorsTable.createdAt));
    res.json(vendors.map(publicVendor));
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.put("/admin/vendors/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body as { status?: string };
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "status must be pending, approved or rejected" });
      return;
    }
    const [vendor] = await db.update(vendorsTable).set({ status }).where(eq(vendorsTable.id, req.params.id as string)).returning();
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }
    res.json(publicVendor(vendor));
  } catch (err) {
    console.error("Error updating vendor status:", err);
    res.status(500).json({ error: "Failed to update vendor status" });
  }
});

router.put("/admin/vendors/:id/commission", requireAdmin, async (req, res) => {
  try {
    const { commissionRate } = req.body as { commissionRate?: number | null };
    const [vendor] = await db
      .update(vendorsTable)
      .set({ commissionRate: commissionRate ?? null })
      .where(eq(vendorsTable.id, req.params.id as string))
      .returning();
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }
    res.json(publicVendor(vendor));
  } catch (err) {
    console.error("Error updating commission rate:", err);
    res.status(500).json({ error: "Failed to update commission rate" });
  }
});

// ---------------------------------------------------------------------------
// Platform commission default
// ---------------------------------------------------------------------------
router.get("/admin/commission-rate", requireAdmin, async (_req, res) => {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "commission_rate"));
  res.json({ commissionRate: row ? Number(row.value) : 10 });
});

router.put("/admin/commission-rate", requireAdmin, async (req, res) => {
  try {
    const { commissionRate } = req.body as { commissionRate?: number };
    if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 100) {
      res.status(400).json({ error: "commissionRate must be a number between 0 and 100" });
      return;
    }
    await db
      .insert(siteSettingsTable)
      .values({ key: "commission_rate", value: String(commissionRate) })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: String(commissionRate), updatedAt: sql`now()` } });
    res.json({ commissionRate });
  } catch (err) {
    console.error("Error updating commission rate:", err);
    res.status(500).json({ error: "Failed to update commission rate" });
  }
});

// ---------------------------------------------------------------------------
// Admin product management (manual entry for any vendor)
// ---------------------------------------------------------------------------
router.get("/admin/products", requireAdmin, async (_req, res) => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  res.json(products);
});

router.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      vendorId: string;
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

    if (!body.vendorId || !body.name || typeof body.price !== "number") {
      res.status(400).json({ error: "vendorId, name and price are required" });
      return;
    }

    const [vendor] = await db.select({ id: vendorsTable.id }).from(vendorsTable).where(eq(vendorsTable.id, body.vendorId));
    if (!vendor) {
      res.status(400).json({ error: "Vendor not found" });
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
        vendorId: body.vendorId,
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

router.put("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "vendorId",
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
      "images",
    ]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, req.params.id as string)).returning();
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

router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const [product] = await db.delete(productsTable).where(eq(productsTable.id, req.params.id as string)).returning();
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
// Orders overview & revenue
// ---------------------------------------------------------------------------
router.get("/admin/orders", requireAdmin, async (_req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const allItems = orders.length > 0
      ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orders.map((o) => o.id)))
      : [];
    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }
    res.json(orders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] })));
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.put("/admin/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body as { status?: string };
    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
      return;
    }
    const [order] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, req.params.id as string))
      .returning();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

router.get("/admin/revenue", requireAdmin, async (_req, res) => {
  try {
    const [totals] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalSales: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
        totalCommission: sql<number>`coalesce(sum(${ordersTable.commissionTotal}), 0)`,
      })
      .from(ordersTable);

    const [vendorCounts] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${vendorsTable.status} = 'pending')`,
        approved: sql<number>`count(*) filter (where ${vendorsTable.status} = 'approved')`,
      })
      .from(vendorsTable);

    res.json({
      totalOrders: Number(totals?.totalOrders ?? 0),
      totalSales: Number(totals?.totalSales ?? 0),
      totalCommission: Number(totals?.totalCommission ?? 0),
      vendors: {
        total: Number(vendorCounts?.total ?? 0),
        pending: Number(vendorCounts?.pending ?? 0),
        approved: Number(vendorCounts?.approved ?? 0),
      },
    });
  } catch (err) {
    console.error("Error fetching revenue:", err);
    res.status(500).json({ error: "Failed to fetch revenue" });
  }
});

export default router;
