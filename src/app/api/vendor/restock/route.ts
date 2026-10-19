import { and, asc, desc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, restockLines, restockRequests, wholesalerProducts, wholesalers } from "@/db/schema";
import { fail, ok, requirePremium, requireVendor, route } from "@/lib/api";
import { isPremium, num, publicWholesaler, weightLabel } from "@/lib/dto";
import { restockCreate } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** Vendor restock overview: out-of-stock items plus every request and its quotes. */
export const GET = route(async () => {
  const { store } = await requireVendor();
  const oos = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, store.id), or(eq(products.inStock, false), lte(products.stockQty, 0))))
    .orderBy(asc(products.name));
  const premium = isPremium(store);
  if (!premium) return ok({ premium: false, oos: oos.map(oosDto), requests: [] });

  const reqRows = await db
    .select({ r: restockRequests, w: wholesalers })
    .from(restockRequests)
    .innerJoin(wholesalers, eq(restockRequests.wholesalerId, wholesalers.id))
    .where(eq(restockRequests.storeId, store.id))
    .orderBy(desc(restockRequests.createdAt));
  const lines = reqRows.length
    ? await db
        .select()
        .from(restockLines)
        .where(inArray(restockLines.requestId, reqRows.map((r) => r.r.id)))
        .orderBy(asc(restockLines.itemName))
    : [];
  // Attach each wholesaler's grade for the item, so vendors can compare quality.
  const names = [...new Set(lines.map((l) => l.itemName.toLowerCase()))];
  const catalog = names.length
    ? await db
        .select({ name: wholesalerProducts.name, grade: wholesalerProducts.grade, wid: wholesalerProducts.wholesalerId })
        .from(wholesalerProducts)
        .where(inArray(sql`lower(${wholesalerProducts.name})`, names))
    : [];
  const gradeKey = (wid: string, name: string) => `${wid}|${name.toLowerCase()}`;
  const gradeMap = new Map(catalog.map((c) => [gradeKey(c.wid, c.name), c.grade]));

  return ok({
    premium: true,
    oos: oos.map(oosDto),
    requests: reqRows.map(({ r, w }) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      wholesaler: publicWholesaler(w),
      lines: lines
        .filter((l) => l.requestId === r.id)
        .map((l) => ({
          id: l.id,
          productId: l.productId,
          itemName: l.itemName,
          weightLabel: l.weightLabel,
          qty: l.qty,
          lastCost: num(l.lastCost),
          quotePrice: l.quotePrice == null ? null : num(l.quotePrice),
          quoteQty: l.quoteQty,
          grade: gradeMap.get(gradeKey(w.id, l.itemName)) ?? null,
          status: l.status,
        })),
    })),
  });
});

function oosDto(p: typeof products.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    imageUrl: p.imageUrl,
    weightLabel: weightLabel(p.weightValue, p.weightUnit),
    price: num(p.price),
    lastCost: p.costPrice == null ? null : num(p.costPrice),
    stockQty: p.stockQty,
    inStock: p.inStock,
  };
}

/**
 * Send out-of-stock items to chosen wholesalers. One request per wholesaler.
 * Premium only. Items already open with that wholesaler are not duplicated.
 */
export const POST = route(async (req) => {
  const { store } = await requireVendor();
  requirePremium(store);
  const body = restockCreate.parse(await req.json());

  const oos = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, store.id), or(eq(products.inStock, false), lte(products.stockQty, 0))));
  const pick: { product: (typeof oos)[number]; qty: number }[] = body.items?.length
    ? body.items.flatMap((i) => {
        const product = oos.find((p) => p.id === i.productId);
        return product ? [{ product, qty: i.qty }] : [];
      })
    : oos.map((p) => ({ product: p, qty: 10 }));
  if (!pick.length) fail(400, "No out-of-stock items to send");

  const targets = await db.select().from(wholesalers).where(inArray(wholesalers.id, body.wholesalerIds));
  if (targets.length !== body.wholesalerIds.length) fail(404, "One of the wholesalers was not found");

  const created = await db.transaction(async (tx) => {
    const out: string[] = [];
    for (const w of targets) {
      let [req] = await tx
        .select()
        .from(restockRequests)
        .where(and(eq(restockRequests.storeId, store.id), eq(restockRequests.wholesalerId, w.id), eq(restockRequests.status, "open")))
        .limit(1);
      if (!req) {
        [req] = await tx.insert(restockRequests).values({ storeId: store.id, wholesalerId: w.id, status: "open" }).returning();
      }
      const existing = await tx.select({ productId: restockLines.productId }).from(restockLines).where(eq(restockLines.requestId, req.id));
      const have = new Set(existing.map((e) => e.productId));
      for (const { product, qty } of pick) {
        if (have.has(product.id)) continue;
        await tx.insert(restockLines).values({
          requestId: req.id,
          productId: product.id,
          itemName: product.name,
          weightLabel: weightLabel(product.weightValue, product.weightUnit),
          qty,
          lastCost: product.costPrice,
          status: "requested",
        });
      }
      out.push(req.id);
    }
    return out;
  });
  return ok({ requestIds: created, sent: pick.length, wholesalers: targets.length }, 201);
});
