import { NextResponse } from "next/server";
import { db } from "@/db";
import { facilities, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const st = await db.select().from(stores).where(eq(stores.id, rows[0].storeId)).limit(1);
  if (!st.length || st[0].ownerId !== session.id) return NextResponse.json({ error: "Not your store" }, { status: 403 });
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["title", "description", "unit", "imageUrl", "isActive"]) if (k in body) patch[k] = body[k];
  if ("price" in body) patch.price = String(body.price);
  const updated = await db.update(facilities).set(patch).where(eq(facilities.id, id)).returning();
  return NextResponse.json({ facility: updated[0] });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const st = await db.select().from(stores).where(eq(stores.id, rows[0].storeId)).limit(1);
  if (!st.length || st[0].ownerId !== session.id) return NextResponse.json({ error: "Not your store" }, { status: 403 });
  await db.delete(facilities).where(eq(facilities.id, id));
  return NextResponse.json({ ok: true });
}
