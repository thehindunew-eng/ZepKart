import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, stores, products } from "@/db/schema";
import { seedDemo } from "@/lib/seed";
import { route } from "@/lib/api";

export const dynamic = "force-dynamic";

function guard(req: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const expected = process.env.SEED_TOKEN;
  return !!expected && req.headers.get("x-seed-token") === expected;
}

/** Reports whether demo data is loaded, with row counts. */
export const GET = route(async (req) => {
  if (!guard(req)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [u] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  const [s] = await db.select({ n: sql<number>`count(*)::int` }).from(stores);
  const [p] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  const [demo] = await db.select({ id: users.id }).from(users).where(eq(users.email, "vendor1@zepkart.demo")).limit(1);
  return NextResponse.json({ seeded: !!demo, users: u?.n ?? 0, stores: s?.n ?? 0, products: p?.n ?? 0 });
});

/**
 * Loads demo data. Open in development; in production it requires the
 * x-seed-token header matching SEED_TOKEN. Idempotent: returns seeded:false when present.
 */
export const POST = route(async (req) => {
  if (!guard(req)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const result = await seedDemo();
  return NextResponse.json(result);
});
