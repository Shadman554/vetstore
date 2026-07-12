import { Router } from "express";
import { randomUUID } from "crypto";
import { db, categoriesTable, vendorsTable, productsTable, reviewsTable, couponsTable } from "@workspace/db";
import { eq, desc, and, gte, lte, ilike, sql, inArray, avg, count } from "drizzle-orm";
import { requireAdmin, optionalCustomer } from "../lib/auth";
import { makeUniqueSlug } from "../lib/slug";

const router = Router();

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
router.get("/categories", async (_req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/admin/categories", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const slug = await makeUniqueSlug(name, async (candidate) => {
      const [row] = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, candidate));
      return !!row;
    });
    const [category] = await db.insert(categoriesTable).values({ id: randomUUID(), slug, name }).returning();
    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.delete("/admin/categories/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params.id as string));
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// ---------------------------------------------------------------------------
// Vendors (public storefronts)
// ---------------------------------------------------------------------------
function publicVendor(v: typeof vendorsTable.$inferSelect) {
  const { passwordHash, email, commissionRate, ...rest } = v;
  return rest;
}

router.get("/vendors", async (_req, res) => {
  try {
    const vendors = await db.select().from(vendorsTable).where(eq(vendorsTable.status, "approved")).orderBy(vendorsTable.name);
    res.json(vendors.map(publicVendor));
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.get("/vendors/:slug", async (req, res) => {
  try {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.slug, req.params.slug as string));
    if (!vendor || vendor.status !== "approved") {
      res.status(404).json({ error: "Store not found" });
      return;
    }
    res.json(publicVendor(vendor));
  } catch (err) {
    console.error("Error fetching vendor:", err);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

// ---------------------------------------------------------------------------
// Products (public browse & detail)
// ---------------------------------------------------------------------------
router.get("/products", async (req, res) => {
  try {
    const { category, vendorId, species, brand, q, minPrice, maxPrice, sort } = req.query as Record<string, string | undefined>;

    const conditions = [eq(productsTable.status, "active"), eq(vendorsTable.status, "approved")];
    if (category) conditions.push(eq(productsTable.categoryId, category));
    if (vendorId) conditions.push(eq(productsTable.vendorId, vendorId));
    if (species) conditions.push(eq(productsTable.species, species));
    if (brand) conditions.push(ilike(productsTable.brand, brand));
    if (q) conditions.push(ilike(productsTable.name, `%${q}%`));
    if (minPrice) conditions.push(gte(productsTable.price, Number(minPrice)));
    if (maxPrice) conditions.push(lte(productsTable.price, Number(maxPrice)));

    let orderBy = desc(productsTable.createdAt);
    if (sort === "price_asc") orderBy = sql`${productsTable.price} asc` as unknown as typeof orderBy;
    if (sort === "price_desc") orderBy = sql`${productsTable.price} desc` as unknown as typeof orderBy;
    if (sort === "name_asc") orderBy = sql`${productsTable.name} asc` as unknown as typeof orderBy;

    const rows = await db
      .select({ product: productsTable, vendorName: vendorsTable.name, vendorSlug: vendorsTable.slug })
      .from(productsTable)
      .innerJoin(vendorsTable, eq(productsTable.vendorId, vendorsTable.id))
      .where(and(...conditions))
      .orderBy(orderBy);

    res.setHeader("Cache-Control", "no-store");
    res.json(rows.map((r) => ({ ...r.product, vendorName: r.vendorName, vendorSlug: r.vendorSlug })));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("DATABASE_URL")) {
      res.status(503).json({ error: "Database not configured. Set DATABASE_URL." });
    } else {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  }
});

router.get("/products/:slug", async (req, res) => {
  try {
    const [row] = await db
      .select({ product: productsTable, vendorName: vendorsTable.name, vendorSlug: vendorsTable.slug, vendorLogoUrl: vendorsTable.logoUrl })
      .from(productsTable)
      .innerJoin(vendorsTable, eq(productsTable.vendorId, vendorsTable.id))
      .where(eq(productsTable.slug, req.params.slug as string));

    if (!row) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [ratingRow] = await db
      .select({ avgRating: avg(reviewsTable.rating), reviewCount: count(reviewsTable.id) })
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, row.product.id));

    res.json({
      ...row.product,
      vendorName: row.vendorName,
      vendorSlug: row.vendorSlug,
      vendorLogoUrl: row.vendorLogoUrl,
      avgRating: ratingRow?.avgRating ? Number(ratingRow.avgRating) : null,
      reviewCount: ratingRow?.reviewCount ?? 0,
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
router.get("/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, req.params.id as string))
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/products/:id/reviews", optionalCustomer, async (req, res) => {
  try {
    const { rating, comment, customerName } = req.body as { rating?: number; comment?: string; customerName?: string };
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "rating must be between 1 and 5" });
      return;
    }
    if (!req.customerId && !customerName) {
      res.status(400).json({ error: "customerName is required for guest reviews" });
      return;
    }

    const [product] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, req.params.id as string));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [review] = await db
      .insert(reviewsTable)
      .values({
        id: randomUUID(),
        productId: req.params.id as string,
        customerId: req.customerId ?? null,
        customerName: customerName ?? "Verified customer",
        rating: Math.round(rating),
        comment: comment ?? null,
      })
      .returning();

    res.status(201).json(review);
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// ---------------------------------------------------------------------------
// Coupon validation (used at checkout)
// ---------------------------------------------------------------------------
router.post("/coupons/validate", async (req, res) => {
  try {
    const { code, vendorIds } = req.body as { code?: string; vendorIds?: string[] };
    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase()));
    if (!coupon || !coupon.active) {
      res.status(404).json({ error: "Invalid coupon code" });
      return;
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ error: "This coupon has expired" });
      return;
    }
    if (coupon.vendorId && (!vendorIds || !vendorIds.includes(coupon.vendorId))) {
      res.status(400).json({ error: "This coupon does not apply to items in your cart" });
      return;
    }
    res.json(coupon);
  } catch (err) {
    console.error("Error validating coupon:", err);
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

export default router;
