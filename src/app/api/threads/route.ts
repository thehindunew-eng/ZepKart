import { NextResponse } from "next/server";
import { db } from "@/db";
import { threads, messages, products, stores, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const storeId = searchParams.get("storeId");
  const mine = searchParams.get("mine");

  let rows = await db.select().from(threads).orderBy(desc(threads.lastMessageAt));
  if (productId) rows = rows.filter((t) => t.productId === productId);
  if (storeId) rows = rows.filter((t) => t.storeId === storeId);

  // scope: vendors see threads for their stores, customers see own threads — unless explicit productId view by vendor
  const myStores = await db.select().from(stores).where(eq(stores.ownerId, session.id));
  const myStoreIds = new Set(myStores.map((s) => s.id));
  const isVendorViewingOwnStore = storeId && myStoreIds.has(storeId);

  if (mine === "1" || session.role === "customer") {
    if (!(productId && session.role === "vendor")) {
      rows = rows.filter((t) => t.customerId === session.id || myStoreIds.has(t.storeId));
    }
  }
  // if vendor viewing own store threads, keep all for that store
  if (session.role === "vendor" && !mine && !productId && !storeId) {
    rows = rows.filter((t) => myStoreIds.has(t.storeId));
  }

  const allProducts = await db.select().from(products);
  const pmap = new Map(allProducts.map((p) => [p.id, p]));
  const allStores = await db.select().from(stores);
  const smap = new Map(allStores.map((s) => [s.id, s]));
  const allUsers = await db.select().from(users);
  const umap = new Map(allUsers.map((u) => [u.id, u]));

  // attach last message preview
  const enriched = await Promise.all(
    rows.slice(0, 100).map(async (t) => {
      const msgs = await db.select().from(messages).where(eq(messages.threadId, t.id)).orderBy(desc(messages.createdAt)).limit(1);
      return {
        ...t,
        product: t.productId ? pmap.get(t.productId) ?? null : null,
        store: smap.get(t.storeId) ?? null,
        customer: t.customerId ? { id: t.customerId, name: umap.get(t.customerId)?.name ?? "Customer" } : null,
        preview: msgs[0]?.content ?? "",
      };
    })
  );
  return NextResponse.json({ threads: enriched });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json();
  const { productId, storeId, type, offerPrice, fulfillment, content } = body;
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

  // find or create thread: same customer + product + open
  let threadId: string | null = null;
  if (productId) {
    const existing = await db
      .select()
      .from(threads)
      .where(and(eq(threads.productId, productId), eq(threads.customerId, session.id)));
    const open = existing.find((t) => t.status === "open");
    if (open) threadId = open.id;
  }
  if (!threadId) {
    const inserted = await db
      .insert(threads)
      .values({
        productId: productId || null,
        storeId,
        customerId: session.id,
        type: type || "general",
        offerPrice: offerPrice ? String(offerPrice) : null,
        fulfillment: fulfillment || "delivery",
        status: "open",
      })
      .returning();
    threadId = inserted[0].id;
  } else {
    await db
      .update(threads)
      .set({
        type: type || undefined,
        offerPrice: offerPrice ? String(offerPrice) : undefined,
        fulfillment: fulfillment || undefined,
        lastMessageAt: new Date(),
      })
      .where(eq(threads.id, threadId));
  }
  if (content) {
    await db.insert(messages).values({
      threadId,
      senderId: session.id,
      content: String(content).slice(0, 2000),
      offerPrice: offerPrice ? String(offerPrice) : null,
    });
    await db.update(threads).set({ lastMessageAt: new Date() }).where(eq(threads.id, threadId));
  }
  const t = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  return NextResponse.json({ thread: t[0] });
}
