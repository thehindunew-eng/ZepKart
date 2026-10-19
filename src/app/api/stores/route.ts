import { and, desc, eq, gt, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { stores, products } from "@/db/schema";
import { ok, route } from "@/lib/api";
import { publicStore } from "@/lib/dto";
import { distanceKm } from "@/lib/geo";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";

/**
 * Store list. Optional lat/lng adds distanceKm and sorts by distance (sort=distance).
 * Optional radius (km) limits results to nearby stores.
 */
export const GET = route(async (req) => {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const q = url.searchParams.get("q")?.trim();
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng) && url.searchParams.has("lat") && url.searchParams.has("lng");
  const radius = Number(url.searchParams.get("radius"));
  const sort = url.searchParams.get("sort") ?? "default";
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
  let list = [];
  for (const row of rows) {
    const s = await refreshStore(row);
    const distance =
      hasPoint && s.lat != null && s.lng != null ? distanceKm(lat, lng, Number(s.lat), Number(s.lng)) : null;
    list.push({ ...publicStore(s), productCount: countBy.get(s.id) ?? 0, distanceKm: distance });
  }
  if (hasPoint && Number.isFinite(radius) && radius > 0) list = list.filter((s) => s.distanceKm != null && s.distanceKm <= radius);
  if (sort === "distance" && hasPoint) list.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  return ok({ stores: list });
});
