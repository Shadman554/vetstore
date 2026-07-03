import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, desc, count, max, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { deleteR2Folder } from "../lib/r2";

const router = Router();

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || Date.now().toString();
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const existing = await db
    .select({ id: productsTable.id })
    .from(productsTable);
  const ids = new Set(existing.map((p) => p.id));
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function generateCode(num: number): string {
  return `WAW-${String(num).padStart(3, "0")}`;
}

async function getNextCodeNum(): Promise<number> {
  const [row] = await db
    .select({ maxNum: sql<number>`COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0)` })
    .from(productsTable)
    .where(sql`code LIKE 'WAW-%'`);
  return (row?.maxNum ?? 0) + 1;
}

router.get("/admin/next-code", requireAdmin, async (_req, res) => {
  try {
    const nextNum = await getNextCodeNum();
    res.json({ code: generateCode(nextNum) });
  } catch (err) {
    console.error("Error getting next code:", err);
    res.status(500).json({ error: "Failed to get next code" });
  }
});

router.get("/products", async (_req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .orderBy(desc(productsTable.createdAt));
    res.setHeader("Cache-Control", "no-store");
    res.json(products);
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

router.get("/products/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/admin/products", requireAdmin, async (req, res) => {
  try {
    const body = req.body as {
      name: string;
      description?: string;
      images?: string[];
      imageUrl?: string;
      priceSingle: number;
      priceBulk?: number;
      bulkMinQty?: number;
      currency?: string;
      ageRange?: string;
    };

    if (!body.name || typeof body.priceSingle !== "number") {
      res.status(400).json({ error: "name and priceSingle are required" });
      return;
    }

    const id = await uniqueSlug(body.name);
    const nextNum = await getNextCodeNum();

    const [product] = await db
      .insert(productsTable)
      .values({
        id,
        code: generateCode(nextNum),
        name: body.name,
        description: body.description ?? null,
        images: body.images && body.images.length > 0 ? body.images : null,
        imageUrl: body.imageUrl ?? null,
        priceSingle: body.priceSingle,
        priceBulk: body.priceBulk ?? 0,
        bulkMinQty: body.bulkMinQty != null ? Math.min(Math.round(body.bulkMinQty), 2_147_483_647) : null,
        currency: body.currency ?? "USD",
        ageRange: body.ageRange ?? null,
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
    const id = req.params.id as string;
    const body = req.body as Partial<{
      name: string;
      code: string;
      description: string;
      images: string[];
      imageUrl: string;
      priceSingle: number;
      priceBulk: number;
      bulkMinQty: number;
      currency: string;
      ageRange: string | null;
    }>;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.code !== undefined && /^WAW-\d{3,}$/.test(body.code)) updates.code = body.code;
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.images !== undefined)
      updates.images = body.images.length > 0 ? body.images : null;
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null;
    if (body.priceSingle !== undefined) updates.priceSingle = body.priceSingle;
    if (body.priceBulk !== undefined) updates.priceBulk = body.priceBulk;
    if (body.bulkMinQty !== undefined) updates.bulkMinQty = body.bulkMinQty ? Math.min(Math.round(body.bulkMinQty), 2_147_483_647) : null;
    if (body.currency !== undefined) updates.currency = body.currency;
    if ("ageRange" in body) updates.ageRange = body.ageRange ?? null;

    const [product] = await db
      .update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, id))
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

router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const [product] = await db
      .select({ id: productsTable.id, code: productsTable.code })
      .from(productsTable)
      .where(eq(productsTable.id, id));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (product.code) {
      try {
        await deleteR2Folder(`products/${product.code}/`);
      } catch (r2Err) {
        console.error("R2 cleanup warning (product still deleted):", r2Err);
      }
    }

    await db.delete(productsTable).where(eq(productsTable.id, id));

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
