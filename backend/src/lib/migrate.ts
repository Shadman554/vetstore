import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function runMigrations(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  let host = "(unknown)";
  try {
    host = new URL(url).hostname;
  } catch {}

  logger.info({ host }, "Running database migrations...");

  const client = await pool.connect();
  try {
    // Drop old kid-store products table if it has the wrong schema (identified by presence of 'code' column)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'code'
        ) THEN
          DROP TABLE IF EXISTS "products" CASCADE;
        END IF;
      END
      $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "site_settings" (
        "key"         TEXT        PRIMARY KEY,
        "value"       TEXT        NOT NULL,
        "updated_at"  TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "admin_login_logs" (
        "id"         TEXT        PRIMARY KEY,
        "timestamp"  TIMESTAMP   NOT NULL DEFAULT NOW(),
        "success"    BOOLEAN     NOT NULL,
        "ip"         TEXT,
        "user_agent" TEXT,
        "reason"     TEXT
      );

      CREATE TABLE IF NOT EXISTS "vendors" (
        "id"              TEXT        PRIMARY KEY,
        "slug"            TEXT        NOT NULL UNIQUE,
        "name"            TEXT        NOT NULL,
        "email"           TEXT        NOT NULL UNIQUE,
        "password_hash"   TEXT        NOT NULL,
        "phone"           TEXT,
        "logo_url"        TEXT,
        "banner_url"      TEXT,
        "description"     TEXT,
        "status"          TEXT        NOT NULL DEFAULT 'pending',
        "commission_rate" FLOAT8,
        "created_at"      TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "categories" (
        "id"    TEXT  PRIMARY KEY,
        "slug"  TEXT  NOT NULL UNIQUE,
        "name"  TEXT  NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "customers" (
        "id"            TEXT        PRIMARY KEY,
        "name"          TEXT        NOT NULL,
        "email"         TEXT        NOT NULL UNIQUE,
        "password_hash" TEXT        NOT NULL,
        "phone"         TEXT,
        "created_at"    TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "products" (
        "id"              TEXT        PRIMARY KEY,
        "vendor_id"       TEXT        NOT NULL,
        "slug"            TEXT        NOT NULL UNIQUE,
        "sku"             TEXT,
        "barcode"         TEXT,
        "brand"           TEXT,
        "category_id"     TEXT,
        "species"         TEXT,
        "name"            TEXT        NOT NULL,
        "description"     TEXT,
        "ingredients"     TEXT,
        "images"          TEXT[],
        "price"           FLOAT8      NOT NULL,
        "sale_price"      FLOAT8,
        "stock"           INTEGER     NOT NULL DEFAULT 0,
        "weight"          TEXT,
        "expiration_date" DATE,
        "status"          TEXT        NOT NULL DEFAULT 'active',
        "created_at"      TIMESTAMP   NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "coupons" (
        "id"             TEXT        PRIMARY KEY,
        "vendor_id"      TEXT,
        "code"           TEXT        NOT NULL UNIQUE,
        "discount_type"  TEXT        NOT NULL,
        "discount_value" FLOAT8      NOT NULL,
        "expires_at"     TIMESTAMP,
        "active"         BOOLEAN     NOT NULL DEFAULT TRUE,
        "created_at"     TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "orders" (
        "id"               TEXT        PRIMARY KEY,
        "customer_id"      TEXT,
        "customer_name"    TEXT        NOT NULL,
        "customer_phone"   TEXT        NOT NULL,
        "customer_address" TEXT,
        "status"           TEXT        NOT NULL DEFAULT 'pending',
        "subtotal"         FLOAT8      NOT NULL,
        "discount_total"   FLOAT8      NOT NULL DEFAULT 0,
        "commission_total" FLOAT8      NOT NULL DEFAULT 0,
        "total"            FLOAT8      NOT NULL,
        "coupon_code"      TEXT,
        "created_at"       TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "order_items" (
        "id"                TEXT    PRIMARY KEY,
        "order_id"          TEXT    NOT NULL,
        "product_id"        TEXT    NOT NULL,
        "vendor_id"         TEXT    NOT NULL,
        "product_name"      TEXT    NOT NULL,
        "quantity"          INTEGER NOT NULL,
        "unit_price"        FLOAT8  NOT NULL,
        "line_total"        FLOAT8  NOT NULL,
        "commission_rate"   FLOAT8  NOT NULL,
        "commission_amount" FLOAT8  NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "reviews" (
        "id"            TEXT        PRIMARY KEY,
        "product_id"    TEXT        NOT NULL,
        "customer_id"   TEXT,
        "customer_name" TEXT        NOT NULL,
        "rating"        INTEGER     NOT NULL,
        "comment"       TEXT,
        "created_at"    TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "wishlist" (
        "id"          TEXT        PRIMARY KEY,
        "customer_id" TEXT        NOT NULL,
        "product_id"  TEXT        NOT NULL,
        "created_at"  TIMESTAMP   NOT NULL DEFAULT NOW()
      );
    `);

    logger.info("Database migrations complete.");
  } catch (err) {
    logger.error({ err }, "Database migration failed — check DATABASE_URL is correctly set");
    throw err;
  } finally {
    client.release();
  }
}
