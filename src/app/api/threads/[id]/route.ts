import { NextResponse } from "next/server";
import { db } from "@/db";
import { threads, messages, users, products, stores } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const t = await db.select().from(threads).where(eq(threads.id, id)).limit(1);
  if (!t.length) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  const thread = t[0];
  const msgs = await db.select().from(messages).where(eq(messages.threadId, id)).orderBy(asc(messages.createdAt));
  const allUsers = await db.select().from(users);
  const umap = new Map(allUsers.map((u) => [u.id, { id: u.id, name: u.name, role: u.role }]));
  let product = null;
  let store = null;
  if (thread.productId) {
    const p = await db.select().from(products).where(eq(products.id, thread.productId)).limit(1);
    product = p[0] ?? null;
  }
  const s = await db.select().from(stores).where(eq(stores.id, thread.storeId)).limit(1);
  store = s[0] ?? null;
  return NextResponse.json({
    thread,
    messages: msgs.map((m) => ({ ...m, sender: m.senderId ? umap.get(m.senderId) ?? null : null })),
    product,
    store,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ("status" in body) patch.status = body.status;
  if ("offerPrice" in body) patch.offerPrice = body.offerPrice ? String(body.offerPrice) : null;
  if ("fulfillment" in body) patch.fulfillment = body.fulfillment;
  if ("type" in body) patch.type = body.type;
  patch.lastMessageAt = new Date();
  const updated = await db.update(threads).set(patch).where(eq(threads.id, id)).returning();
  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread: updated[0] });
}
