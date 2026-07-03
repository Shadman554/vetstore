import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router = Router();

const DEFAULT_WHATSAPP = process.env.WHATSAPP_NUMBER ?? "9647501234567";

async function getSetting(key: string): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(siteSettingsTable)
      .where(sql`${siteSettingsTable.key} = ${key}`);
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

router.get("/settings", async (_req, res) => {
  try {
    const whatsappNumber = (await getSetting("whatsapp_number")) ?? DEFAULT_WHATSAPP;
    const whatsappEnabledStr = await getSetting("whatsapp_enabled");
    // If not in database, use env var. If env var not set, default to true
    const whatsappEnabled = whatsappEnabledStr !== null 
      ? whatsappEnabledStr !== "false"
      : process.env.WHATSAPP_ENABLED !== "false";
    res.json({ whatsappNumber, whatsappEnabled });
  } catch (err) {
    console.error("Error fetching settings:", err);
    const whatsappEnabled = process.env.WHATSAPP_ENABLED !== "false";
    res.json({ whatsappNumber: DEFAULT_WHATSAPP, whatsappEnabled });
  }
});

router.put("/admin/settings", requireAdmin, async (req, res) => {
  try {
    const { whatsappNumber, whatsappEnabled } = req.body as { whatsappNumber?: string; whatsappEnabled?: boolean };

    if (whatsappNumber) {
      const cleaned = whatsappNumber.replace(/\D/g, "");
      if (!cleaned) {
        res.status(400).json({ error: "Invalid phone number" });
        return;
      }
      await db
        .insert(siteSettingsTable)
        .values({ key: "whatsapp_number", value: cleaned })
        .onConflictDoUpdate({
          target: siteSettingsTable.key,
          set: { value: cleaned, updatedAt: sql`now()` },
        });
    }

    if (whatsappEnabled !== undefined) {
      await db
        .insert(siteSettingsTable)
        .values({ key: "whatsapp_enabled", value: whatsappEnabled ? "true" : "false" })
        .onConflictDoUpdate({
          target: siteSettingsTable.key,
          set: { value: whatsappEnabled ? "true" : "false", updatedAt: sql`now()` },
        });
    }

    const finalNumber = whatsappNumber ? whatsappNumber.replace(/\D/g, "") : (await getSetting("whatsapp_number")) ?? DEFAULT_WHATSAPP;
    const finalEnabled = whatsappEnabled !== undefined 
      ? whatsappEnabled 
      : (await getSetting("whatsapp_enabled")) !== null
        ? (await getSetting("whatsapp_enabled")) !== "false"
        : process.env.WHATSAPP_ENABLED !== "false";
    res.json({ whatsappNumber: finalNumber, whatsappEnabled: finalEnabled });
  } catch (err) {
    console.error("Error saving setting:", err);
    res.status(500).json({ error: "Failed to save setting" });
  }
});

export default router;
