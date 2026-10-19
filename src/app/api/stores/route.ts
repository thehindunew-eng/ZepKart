import { and, desc, eq, gt, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores, products } from "@/db/schema";
import { ok, route } from "@/lib/api";
import { publicStore } from "@/lib/dto";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const q = url.searchParams.get("q")?.trim();
  const conds = [];
  if (city) conds.push(eq(stores.city, city));
  if (q) conds.push(or(ilike(stores.shopName, `%${q}%`), ilike(stores.locality, `%${q}%`)));
  const rows = await db
    .select()
    .from(stores)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(stores.isOpen), desc(stores.rating));
  const counts = await db
    .select({ storeId: products.storeId, n: sql<number>`count(*)::int` })
    .from(products)
    .where(and(eq(products.inStock, true), gt(products.stockQty, 0)))
    .groupBy(products.storeId);
  const countBy = new Map(counts.map((c) => [c.storeId, c.n]));
  const list = [];
  for (const row of rows) {
    const s = await refreshStore(row);
    list.push({ ...publicStore(s), productCount: countBy.get(s.id) ?? 0 });
  }
  return ok({ stores: list });
});
