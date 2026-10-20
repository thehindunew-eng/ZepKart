import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { ok, route } from "@/lib/api";
import { publicProduct } from "@/lib/dto";
import { distanceKm } from "@/lib/geo";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";

/**
 * Cross-store product search.
 * sort=price    cheapest first (ties broken by distance when lat/lng is given)
 * sort=distance nearest store first (requires lat/lng)
 * radius        optional km limit (requires lat/lng)
 */
export const GET = route(async (req) => {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const limit = Math.min(120, Number(url.searchParams.get("limit") || 24));
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng) && url.searchParams.has("lat") && url.searchParams.has("lng");
  const radius = Number(url.searchParams.get("radius"));
  const sort = url.searchParams.get("sort") ?? "default";

  const conds = [];
  if (city) conds.push(eq(stores.city, city));
  if (category) conds.push(eq(products.category, category));
  if (q) conds.push(or(ilike(products.name, `%${q}%`), ilike(products.category, `%${q}%`), ilike(stores.shopName, `%${q}%`)));
  const orderBy =
    sort === "price"
      ? [desc(sql`(${products.inStock} and ${products.stockQty} > 0)`), asc(products.price)]
      : [desc(sql`(${products.inStock} and ${products.stockQty} > 0)`), asc(products.name)];
  const rows = await db
    .select({ p: products, s: stores })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(...orderBy)
    .limit(sort === "default" && !hasPoint ? limit : 400);

  let list = [];
  for (const r of rows) {
    const s = await refreshStore(r.s);
    const distance = hasPoint && s.lat != null && s.lng != null ? distanceKm(lat, lng, Number(s.lat), Number(s.lng)) : null;
    list.push({ ...publicProduct(r.p, s), distanceKm: distance });
  }
  if (hasPoint && Number.isFinite(radius) && radius > 0) list = list.filter((p) => p.distanceKm != null && p.distanceKm <= radius);
  if (sort === "price") {
    list.sort((a, b) => a.price - b.price || (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  } else if (sort === "distance" && hasPoint) {
    list.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9) || a.price - b.price);
  }
  return ok({ products: list.slice(0, limit) });
});
