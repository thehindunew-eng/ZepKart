import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & { __zepkartPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new Pool({ connectionString, max: 10 });
}

export const pool = globalForDb.__zepkartPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__zepkartPool = pool;

export const db = drizzle(pool, { schema });
