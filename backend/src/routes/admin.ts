import { Router } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { db, siteSettingsTable, adminLoginLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { randomUUID } from "crypto";

const router = Router();

const BCRYPT_ROUNDS = 12;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

const changePinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password change attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

async function getAdminPin(): Promise<string | undefined> {
  try {
    const rows = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, "admin_pin"));
    return rows[0]?.value ?? process.env.ADMIN_PIN;
  } catch {
    return process.env.ADMIN_PIN;
  }
}

async function verifyPin(candidate: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2b$") || stored.startsWith("$2a$")) {
    return bcrypt.compare(candidate, stored);
  }
  return candidate === stored;
}

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

async function logLoginAttempt(
  success: boolean,
  ip: string | undefined,
  userAgent: string | undefined,
  reason?: string,
) {
  try {
    await db.insert(adminLoginLogsTable).values({
      id: randomUUID(),
      success,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      reason: reason ?? null,
    });
  } catch {
    // never let audit logging break authentication
  }
}

router.post("/admin/login", loginLimiter, async (req, res) => {
  const { password } = req.body as { password?: string };
  const jwtSecret = process.env.JWT_SECRET;
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.socket.remoteAddress;
  const ua = req.headers["user-agent"];

  if (!jwtSecret) {
    res.status(500).json({ error: "Server authentication not configured. Set JWT_SECRET environment variable." });
    return;
  }

  const storedPin = await getAdminPin();

  if (!storedPin) {
    res.status(500).json({ error: "Server authentication not configured. Set ADMIN_PIN environment variable." });
    return;
  }

  if (!password) {
    await logLoginAttempt(false, ip, ua, "empty_password");
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  const valid = await verifyPin(password, storedPin);

  if (!valid) {
    await logLoginAttempt(false, ip, ua, "wrong_password");
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  // If stored as plaintext, re-hash it now for security
  if (!storedPin.startsWith("$2b$") && !storedPin.startsWith("$2a$")) {
    const hashed = await hashPin(password);
    await db
      .insert(siteSettingsTable)
      .values({ key: "admin_pin", value: hashed })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: hashed, updatedAt: new Date() } });
  }

  await logLoginAttempt(true, ip, ua);

  const expiresIn = 4 * 60 * 60;
  const token = jwt.sign({ admin: true }, jwtSecret, { expiresIn });
  res.json({ token, expiresIn });
});

router.get("/admin/verify", (req, res) => {
  const auth = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;

  if (!auth?.startsWith("Bearer ") || !jwtSecret) {
    res.status(401).json({ valid: false });
    return;
  }

  try {
    jwt.verify(auth.slice(7), jwtSecret);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

router.post("/admin/change-pin", requireAdmin, changePinLimiter, async (req, res) => {
  const { currentPin, newPin } = req.body as { currentPin?: string; newPin?: string };

  if (!currentPin || !newPin) {
    res.status(400).json({ error: "currentPin and newPin are required" });
    return;
  }

  if (newPin.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  if (!/[a-zA-Z]/.test(newPin) || !/[0-9]/.test(newPin)) {
    res.status(400).json({ error: "Password must contain both letters and numbers" });
    return;
  }

  const storedPin = await getAdminPin();

  if (!storedPin) {
    res.status(500).json({ error: "Server authentication not configured" });
    return;
  }

  const valid = await verifyPin(currentPin, storedPin);

  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const hashed = await hashPin(newPin);

  await db
    .insert(siteSettingsTable)
    .values({ key: "admin_pin", value: hashed })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: hashed, updatedAt: new Date() },
    });

  res.json({ success: true });
});

router.get("/admin/login-logs", requireAdmin, async (req, res) => {
  const logs = await db
    .select()
    .from(adminLoginLogsTable)
    .orderBy(desc(adminLoginLogsTable.timestamp))
    .limit(20);
  res.json(logs);
});

export default router;
