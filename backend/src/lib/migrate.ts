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
    await client.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id"            TEXT        PRIMARY KEY,
        "code"          TEXT        NOT NULL,
        "name"          TEXT        NOT NULL,
        "images"        TEXT[],
        "image_url"     TEXT,
        "description"   TEXT,
        "price_single"  FLOAT8      NOT NULL,
        "price_bulk"    FLOAT8      NOT NULL DEFAULT 0,
        "bulk_min_qty"  INTEGER,
        "currency"      TEXT        NOT NULL DEFAULT 'USD',
        "created_at"    TIMESTAMP   NOT NULL DEFAULT NOW()
      );

      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "age_range" TEXT;

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
    `);
    logger.info("Database migrations complete.");
  } catch (err) {
    logger.error({ err }, "Database migration failed — check DATABASE_URL is correctly set in Railway Variables");
    throw err;
  } finally {
    client.release();
  }
}
