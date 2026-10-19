import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

const FLOW = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const order = rows[0];
  const st = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
  const isOwner = st.length && st[0].ownerId === session.id;
  const isCustomer = order.customerId === session.id;
  if (!isOwner && !isCustomer) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ("status" in body) {
    const next = String(body.status);
    // customers can only cancel pending orders
    if (!isOwner && next !== "cancelled") return NextResponse.json({ error: "Only the store can advance status" }, { status: 403 });
    if (!isOwner && order.status !== "pending") return NextResponse.json({ error: "Too late to cancel" }, { status: 400 });
    patch.status = next;
  }
  if (isOwner && "note" in body) patch.note = body.note;
  (patch as { updatedAt?: Date }).updatedAt = new Date();
  const updated = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();
  return NextResponse.json({ order: updated[0], next: FLOW[FLOW.indexOf(updated[0].status) + 1] ?? null });
}
