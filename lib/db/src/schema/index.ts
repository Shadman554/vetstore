import { pgTable, text, doublePrecision, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  images: text("images").array(),
  imageUrl: text("image_url"),
  description: text("description"),
  priceSingle: doublePrecision("price_single").notNull(),
  priceBulk: doublePrecision("price_bulk").notNull().default(0),
  bulkMinQty: integer("bulk_min_qty"),
  currency: text("currency").notNull().default("USD"),
  ageRange: text("age_range"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable, {
  currency: z.enum(["USD", "IQD"]),
  ageRange: z.enum(["0-3", "3-5", "5+"]).nullable().optional(),
}).omit({ createdAt: true });

export type InsertProduct = typeof productsTable.$inferInsert;
export type DbProduct = typeof productsTable.$inferSelect;

export const siteSettingsTable = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminLoginLogsTable = pgTable("admin_login_logs", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  success: boolean("success").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  reason: text("reason"),
});

export type AdminLoginLog = typeof adminLoginLogsTable.$inferSelect;
