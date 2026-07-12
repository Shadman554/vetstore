import { pgTable, text, doublePrecision, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Vendors (veterinary clinics / pet stores / pharmacies selling on the marketplace)
// ---------------------------------------------------------------------------
export const vendorsTable = pgTable("vendors", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  commissionRate: doublePrecision("commission_rate"), // percent override; falls back to platform default
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVendorSchema = createInsertSchema(vendorsTable, {
  status: z.enum(["pending", "approved", "rejected"]).optional(),
}).omit({ createdAt: true });

export type InsertVendor = typeof vendorsTable.$inferInsert;
export type DbVendor = typeof vendorsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable);
export type InsertCategory = typeof categoriesTable.$inferInsert;
export type DbCategory = typeof categoriesTable.$inferSelect;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  vendorId: text("vendor_id").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku"),
  barcode: text("barcode"),
  brand: text("brand"),
  categoryId: text("category_id"),
  species: text("species"), // dog | cat | bird | farm | other
  name: text("name").notNull(),
  description: text("description"),
  ingredients: text("ingredients"),
  images: text("images").array(),
  price: doublePrecision("price").notNull(),
  salePrice: doublePrecision("sale_price"),
  stock: integer("stock").notNull().default(0),
  weight: text("weight"),
  expirationDate: date("expiration_date"),
  status: text("status").notNull().default("active"), // active | inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable, {
  species: z.enum(["dog", "cat", "bird", "farm", "other"]).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
}).omit({ createdAt: true, updatedAt: true });

export type InsertProduct = typeof productsTable.$inferInsert;
export type DbProduct = typeof productsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export const customersTable = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ createdAt: true });
export type InsertCustomer = typeof customersTable.$inferInsert;
export type DbCustomer = typeof customersTable.$inferSelect;

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const couponsTable = pgTable("coupons", {
  id: text("id").primaryKey(),
  vendorId: text("vendor_id"), // null = platform-wide coupon
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // percent | fixed
  discountValue: doublePrecision("discount_value").notNull(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCouponSchema = createInsertSchema(couponsTable, {
  discountType: z.enum(["percent", "fixed"]),
}).omit({ createdAt: true });
export type InsertCoupon = typeof couponsTable.$inferInsert;
export type DbCoupon = typeof couponsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Orders & order items
// ---------------------------------------------------------------------------
export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  status: text("status").notNull().default("pending"), // pending | confirmed | shipped | delivered | cancelled
  subtotal: doublePrecision("subtotal").notNull(),
  discountTotal: doublePrecision("discount_total").notNull().default(0),
  commissionTotal: doublePrecision("commission_total").notNull().default(0),
  total: doublePrecision("total").notNull(),
  couponCode: text("coupon_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable, {
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
}).omit({ createdAt: true });
export type InsertOrder = typeof ordersTable.$inferInsert;
export type DbOrder = typeof ordersTable.$inferSelect;

export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  vendorId: text("vendor_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  lineTotal: doublePrecision("line_total").notNull(),
  commissionRate: doublePrecision("commission_rate").notNull(),
  commissionAmount: doublePrecision("commission_amount").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItemsTable);
export type InsertOrderItem = typeof orderItemsTable.$inferInsert;
export type DbOrderItem = typeof orderItemsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  customerId: text("customer_id"),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable, {
  rating: z.number().int().min(1).max(5),
}).omit({ createdAt: true });
export type InsertReview = typeof reviewsTable.$inferInsert;
export type DbReview = typeof reviewsTable.$inferSelect;

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------
export const wishlistTable = pgTable("wishlist", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  productId: text("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWishlistSchema = createInsertSchema(wishlistTable).omit({ createdAt: true });
export type InsertWishlist = typeof wishlistTable.$inferInsert;
export type DbWishlist = typeof wishlistTable.$inferSelect;

// ---------------------------------------------------------------------------
// Site settings & admin login logs (unchanged)
// ---------------------------------------------------------------------------
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
