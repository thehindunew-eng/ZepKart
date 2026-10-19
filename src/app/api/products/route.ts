import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { ok, route } from "@/lib/api";
import { publicProduct } from "@/lib/dto";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";

/** Cross-store product search for the home page. */
export const GET = route(async (req) => {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(60, Number(url.searchParams.get("limit") || 24));
  const conds = [];
  if (city) conds.push(eq(stores.city, city));
  if (q) conds.push(or(ilike(products.name, `%${q}%`), ilike(products.category, `%${q}%`), ilike(stores.shopName, `%${q}%`)));
  const rows = await db
    .select({ p: products, s: stores })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(sql`(${products.inStock} and ${products.stockQty} > 0)`), asc(products.name))
    .limit(limit);
  const list = [];
  for (const r of rows) {
    const s = await refreshStore(r.s);
    list.push(publicProduct(r.p, s));
  }
  return ok({ products: list });
});
