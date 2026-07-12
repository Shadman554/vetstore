import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import { db, vendorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireVendor } from "../lib/auth";
import { signVendorToken } from "../lib/auth";
import { makeUniqueSlug } from "../lib/slug";

const router = Router();
const BCRYPT_ROUNDS = 12;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

function publicVendor(v: typeof vendorsTable.$inferSelect) {
  const { passwordHash, ...rest } = v;
  return rest;
}

router.post("/vendors/register", async (req, res) => {
  try {
    const { name, email, password, phone, description } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      description?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const [existing] = await db.select({ id: vendorsTable.id }).from(vendorsTable).where(eq(vendorsTable.email, email));
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const slug = await makeUniqueSlug(name, async (candidate) => {
      const [row] = await db.select({ id: vendorsTable.id }).from(vendorsTable).where(eq(vendorsTable.slug, candidate));
      return !!row;
    });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [vendor] = await db
      .insert(vendorsTable)
      .values({
        id: randomUUID(),
        slug,
        name,
        email,
        passwordHash,
        phone: phone ?? null,
        description: description ?? null,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      vendor: publicVendor(vendor),
      message: "Registration received. Your store will be reviewed by the marketplace team before it goes live.",
    });
  } catch (err) {
    console.error("Error registering vendor:", err);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/vendors/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.email, email));
    if (!vendor || !(await bcrypt.compare(password, vendor.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signVendorToken(vendor.id);
    res.json({ token, vendor: publicVendor(vendor) });
  } catch (err) {
    console.error("Error logging in vendor:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/vendors/me", requireVendor, async (req, res) => {
  try {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, req.vendorId as string));
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }
    res.json(publicVendor(vendor));
  } catch (err) {
    console.error("Error fetching vendor profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/vendors/me", requireVendor, async (req, res) => {
  try {
    const body = req.body as Partial<{
      name: string;
      phone: string;
      logoUrl: string;
      bannerUrl: string;
      description: string;
    }>;
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl || null;
    if (body.bannerUrl !== undefined) updates.bannerUrl = body.bannerUrl || null;
    if (body.description !== undefined) updates.description = body.description || null;

    const [vendor] = await db
      .update(vendorsTable)
      .set(updates)
      .where(eq(vendorsTable.id, req.vendorId as string))
      .returning();

    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }
    res.json(publicVendor(vendor));
  } catch (err) {
    console.error("Error updating vendor profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
