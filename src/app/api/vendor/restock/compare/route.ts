import { and, asc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, wholesalerProducts, wholesalers } from "@/db/schema";
import { ok, requirePremium, requireVendor, route } from "@/lib/api";
import { distanceKm } from "@/lib/geo";
import { num, publicWholesaler, weightLabel, wholesalerProductDto } from "@/lib/dto";

export const dynamic = "force-dynamic";

/**
 * Per out-of-stock item: every matching wholesaler offer, cheapest first.
 * Premium only. Each offer includes grade, rating, minimum order, and distance.
 */
export const GET = route(async () => {
  const { store } = await requireVendor();
  requirePremium(store);
  const oos = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, store.id), or(eq(products.inStock, false), lte(products.stockQty, 0))))
    .orderBy(asc(products.name));
  const names = [...new Set(oos.map((p) => p.name.trim().toLowerCase()))];
  const offers = names.length
    ? await db
        .select({ wp: wholesalerProducts, w: wholesalers })
        .from(wholesalerProducts)
        .innerJoin(wholesalers, eq(wholesalerProducts.wholesalerId, wholesalers.id))
        .where(inArray(sql`lower(${wholesalerProducts.name})`, names))
    : [];

  const toOffer = (row: { wp: typeof wholesalerProducts.$inferSelect; w: typeof wholesalers.$inferSelect }) => {
    const d =
      store.lat != null && store.lng != null && row.w.lat != null && row.w.lng != null
        ? distanceKm(Number(store.lat), Number(store.lng), Number(row.w.lat), Number(row.w.lng))
        : null;
    return { ...wholesalerProductDto(row.wp), wholesaler: publicWholesaler(row.w), distanceKm: d };
  };
  const byName = new Map<string, ReturnType<typeof toOffer>[]>();
  for (const row of offers) {
    const key = row.wp.name.trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(toOffer(row));
  }

  return ok({
    items: oos.map((p) => {
      const list = (byName.get(p.name.trim().toLowerCase()) ?? []).sort((a, b) => a.price - b.price);
      const cheapestA = list.find((o) => o.grade === "A");
      return {
        productId: p.id,
        name: p.name,
        weightLabel: weightLabel(p.weightValue, p.weightUnit),
        lastCost: p.costPrice == null ? null : num(p.costPrice),
        offers: list,
        // Cheapest offer with grade A, a sensible default for budget-friendly quality.
        bestValueId: cheapestA?.id ?? list[0]?.id ?? null,
      };
    }),
  });
});
