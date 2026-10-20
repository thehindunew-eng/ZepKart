import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { restockLines, restockRequests, stores } from "@/db/schema";
import { ok, requireWholesaler, route } from "@/lib/api";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

/**
 * Restock requests addressed to this wholesaler. Shows the shop name and locality only.
 * The vendor's phone and owner details are never included.
 */
export const GET = route(async () => {
  const { wholesaler } = await requireWholesaler();
  const reqRows = await db
    .select({ r: restockRequests, s: stores })
    .from(restockRequests)
    .innerJoin(stores, eq(restockRequests.storeId, stores.id))
    .where(eq(restockRequests.wholesalerId, wholesaler.id))
    .orderBy(desc(restockRequests.createdAt));
  const lines = reqRows.length
    ? await db
        .select()
        .from(restockLines)
        .where(inArray(restockLines.requestId, reqRows.map((r) => r.r.id)))
        .orderBy(asc(restockLines.itemName))
    : [];
  return ok({
    requests: reqRows.map(({ r, s }) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      store: { shopName: s.shopName, locality: s.locality, city: s.city },
      lines: lines
        .filter((l) => l.requestId === r.id)
        .map((l) => ({
          id: l.id,
          itemName: l.itemName,
          weightLabel: l.weightLabel ?? "",
          qty: l.qty,
          lastCost: num(l.lastCost),
          quotePrice: l.quotePrice == null ? null : num(l.quotePrice),
          quoteQty: l.quoteQty,
          status: l.status,
        })),
    })),
  });
});
