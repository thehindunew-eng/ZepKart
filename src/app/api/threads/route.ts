import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { messages, products, stores, threads } from "@/db/schema";
import { fail, ok, requireUser, route } from "@/lib/api";
import { threadCreate } from "@/lib/validators";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

/** Lists chats for the logged-in customer, or for the vendor's store. */
export const GET = route(async () => {
  const user = await requireUser();
  let rows: (typeof threads.$inferSelect)[];
  if (user.role === "vendor") {
    const [store] = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    if (!store) fail(404, "Store not found");
    rows = await db.select().from(threads).where(eq(threads.storeId, store.id)).orderBy(desc(threads.lastMessageAt)).limit(200);
  } else {
    rows = await db.select().from(threads).where(eq(threads.customerId, user.id)).orderBy(desc(threads.lastMessageAt)).limit(200);
  }
  if (!rows.length) return ok({ threads: [] });

  const ids = rows.map((t) => t.id);
  const productIds = [...new Set(rows.map((t) => t.productId))];
  const storeIds = [...new Set(rows.map((t) => t.storeId))];
  const [prods, sts, msgs] = await Promise.all([
    db.select({ id: products.id, name: products.name, imageUrl: products.imageUrl, price: products.price }).from(products).where(inArray(products.id, productIds)),
    db.select({ id: stores.id, shopName: stores.shopName, dpUrl: stores.dpUrl }).from(stores).where(inArray(stores.id, storeIds)),
    db.select().from(messages).where(inArray(messages.threadId, ids)).orderBy(desc(messages.createdAt)),
  ]);
  const lastByThread = new Map<string, (typeof messages.$inferSelect)>();
  for (const m of msgs) if (!lastByThread.has(m.threadId)) lastByThread.set(m.threadId, m);

  return ok({
    threads: rows.map((t) => {
      const p = prods.find((x) => x.id === t.productId);
      const s = sts.find((x) => x.id === t.storeId);
      const last = lastByThread.get(t.id);
      return {
        id: t.id,
        status: t.status,
        agreedPrice: t.agreedPrice == null ? null : num(t.agreedPrice),
        unread: user.role === "vendor" ? t.vendorUnread : t.customerUnread,
        lastMessageAt: t.lastMessageAt,
        product: p ? { id: p.id, name: p.name, imageUrl: p.imageUrl, price: num(p.price) } : null,
        store: s ? { id: s.id, shopName: s.shopName, dpUrl: s.dpUrl } : null,
        customerId: t.customerId,
        preview: last ? (last.kind === "offer" ? `Offer ₹${num(last.price)}` : last.kind === "fulfillment" ? `Requested ${last.mode}` : last.content) : "",
      };
    }),
  });
});

/** Opens (or reuses) the single chat for this customer and item. */
export const POST = route(async (req) => {
  const user = await requireUser("customer");
  const { productId } = threadCreate.parse(await req.json());
  const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!p) fail(404, "Item not found");
  const [existing] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.productId, productId), eq(threads.customerId, user.id)))
    .limit(1);
  if (existing) return ok({ thread: { id: existing.id } });
  const [created] = await db
    .insert(threads)
    .values({ storeId: p.storeId, productId, customerId: user.id })
    .onConflictDoNothing()
    .returning();
  const row = created ?? (await db.select().from(threads).where(and(eq(threads.productId, productId), eq(threads.customerId, user.id))).limit(1))[0];
  return ok({ thread: { id: row.id } }, 201);
});
