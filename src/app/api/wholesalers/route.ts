import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { wholesalerProducts, wholesalers } from "@/db/schema";
import { ok, requirePremium, requireVendor, route } from "@/lib/api";
import { distanceKm } from "@/lib/geo";
import { publicWholesaler } from "@/lib/dto";

export const dynamic = "force-dynamic";

/** Wholesaler directory for premium vendors. Contact details are not included. */
export const GET = route(async (req) => {
  const { store } = await requireVendor();
  requirePremium(store);
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const rows = await db
    .select()
    .from(wholesalers)
    .where(city ? eq(wholesalers.city, city) : undefined)
    .orderBy(asc(wholesalers.businessName));
  const counts = await db
    .select({ wid: wholesalerProducts.wholesalerId, n: sql<number>`count(*)::int` })
    .from(wholesalerProducts)
    .where(eq(wholesalerProducts.inStock, true))
    .groupBy(wholesalerProducts.wholesalerId);
  const countBy = new Map(counts.map((c) => [c.wid, c.n]));
  return ok({
    wholesalers: rows.map((w) => ({
      ...publicWholesaler(w),
      itemCount: countBy.get(w.id) ?? 0,
      distanceKm:
        store.lat != null && store.lng != null && w.lat != null && w.lng != null
          ? distanceKm(Number(store.lat), Number(store.lng), Number(w.lat), Number(w.lng))
          : null,
    })),
  });
});
