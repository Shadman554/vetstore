import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import { db, customersTable, ordersTable, orderItemsTable, wishlistTable, productsTable } from "@workspace/db";
import { eq, desc, inArray, and } from "drizzle-orm";
import { requireCustomer, signCustomerToken } from "../lib/auth";

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

function publicCustomer(c: typeof customersTable.$inferSelect) {
  const { passwordHash, ...rest } = c;
  return rest;
}

router.post("/customers/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
    };
    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const [existing] = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.email, email));
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [customer] = await db
      .insert(customersTable)
      .values({ id: randomUUID(), name, email, passwordHash, phone: phone ?? null })
      .returning();

    const token = signCustomerToken(customer.id);
    res.status(201).json({ token, customer: publicCustomer(customer) });
  } catch (err) {
    console.error("Error registering customer:", err);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.post("/customers/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, email));
    if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signCustomerToken(customer.id);
    res.json({ token, customer: publicCustomer(customer) });
  } catch (err) {
    console.error("Error logging in customer:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/customers/me", requireCustomer, async (req, res) => {
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, req.customerId as string));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(publicCustomer(customer));
});

router.get("/customers/me/orders", requireCustomer, async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerId, req.customerId as string))
      .orderBy(desc(ordersTable.createdAt));

    if (orders.length === 0) {
      res.json([]);
      return;
    }
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, orders.map((o) => o.id)));

    res.json(
      orders.map((order) => ({
        ...order,
        items: items.filter((i) => i.orderId === order.id),
      })),
    );
  } catch (err) {
    console.error("Error fetching customer orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/customers/me/wishlist", requireCustomer, async (req, res) => {
  try {
    const rows = await db.select().from(wishlistTable).where(eq(wishlistTable.customerId, req.customerId as string));
    if (rows.length === 0) {
      res.json([]);
      return;
    }
    const products = await db
      .select()
      .from(productsTable)
      .where(inArray(productsTable.id, rows.map((r) => r.productId)));
    res.json(products);
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.post("/customers/me/wishlist", requireCustomer, async (req, res) => {
  try {
    const { productId } = req.body as { productId?: string };
    if (!productId) {
      res.status(400).json({ error: "productId is required" });
      return;
    }
    const [existing] = await db
      .select()
      .from(wishlistTable)
      .where(and(eq(wishlistTable.customerId, req.customerId as string), eq(wishlistTable.productId, productId)));
    if (existing) {
      res.json({ success: true });
      return;
    }
    await db.insert(wishlistTable).values({ id: randomUUID(), customerId: req.customerId as string, productId });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

router.delete("/customers/me/wishlist/:productId", requireCustomer, async (req, res) => {
  try {
    const productId = req.params.productId as string;
    await db
      .delete(wishlistTable)
      .where(and(eq(wishlistTable.customerId, req.customerId as string), eq(wishlistTable.productId, productId)));
    res.json({ success: true });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
