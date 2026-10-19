import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stores, threads, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const product = rows[0];
  const s = await db.select().from(stores).where(eq(stores.id, product.storeId)).limit(1);
  const threadRows = await db.select().from(threads).where(eq(threads.productId, id)).orderBy(desc(threads.lastMessageAt));
  return NextResponse.json({ product, store: s[0] ?? null, threadCount: threadRows.length });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const store = await db.select().from(stores).where(eq(stores.id, rows[0].storeId)).limit(1);
  if (!store.length || store[0].ownerId !== session.id)
    return NextResponse.json({ error: "Only the store owner can update" }, { status: 403 });
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["name", "description", "imageUrl", "weight", "weightUnit", "category", "status", "isFeatured", "stockQty"]) {
    if (k in body) patch[k] = body[k];
  }
  if ("price" in body) patch.price = String(body.price);
  if ("mrp" in body) patch.mrp = String(body.mrp);
  if ("stockQty" in patch) {
    const q = Number(patch.stockQty);
    // auto-flip OOS logic unless explicit status override in same request
    if (!("status" in body)) {
      patch.status = q <= 0 ? "oos" : rows[0].status === "oos" && q > 0 ? "available" : rows[0].status;
    }
  }
  (patch as { updatedAt?: Date }).updatedAt = new Date();
  const updated = await db.update(products).set(patch).where(eq(products.id, id)).returning();
  return NextResponse.json({ product: updated[0] });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const store = await db.select().from(stores).where(eq(stores.id, rows[0].storeId)).limit(1);
  if (!store.length || store[0].ownerId !== session.id)
    return NextResponse.json({ error: "Only the store owner can delete" }, { status: 403 });
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ ok: true });
}
