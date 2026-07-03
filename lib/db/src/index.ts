import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: InstanceType<typeof Pool> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function resolveConnectionString(): string {
  // Try DATABASE_URL first, then DATABASE_PUBLIC_URL as fallback
  // Strip surrounding quotes in case the value was pasted in .env format
  const candidates = [
    process.env.DATABASE_URL,
    process.env.DATABASE_PUBLIC_URL,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const url = raw.replace(/^["']|["']$/g, "").trim();
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
      return url;
    }
  }

  if (process.env.PGHOST) {
    return ""; // pg will use individual PG* env vars
  }

  throw new Error(
    "No valid DATABASE_URL or DATABASE_PUBLIC_URL found. " +
    "Please set a PostgreSQL connection string in Railway Variables.",
  );
}

function getPool(): InstanceType<typeof Pool> {
  if (!_pool) {
    const url = resolveConnectionString();

    const sslDisabled =
      url.includes("sslmode=disable") ||
      url.includes("localhost") ||
      url.includes("127.0.0.1");

    _pool = new Pool(
      url
        ? { connectionString: url, ssl: sslDisabled ? false : { rejectUnauthorized: false } }
        : { ssl: { rejectUnauthorized: false } },
    );
  }
  return _pool;
}

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const pool: InstanceType<typeof Pool> = new Proxy(
  {} as InstanceType<typeof Pool>,
  {
    get(_, prop) {
      return Reflect.get(getPool(), prop, getPool());
    },
  },
);

export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_, prop) {
      return Reflect.get(getDb(), prop, getDb());
    },
  },
);

export * from "./schema";
