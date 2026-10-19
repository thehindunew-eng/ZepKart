import { NextResponse } from "next/server";
import { db } from "@/db";
import { promos, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(promos).where(eq(promos.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const st = await db.select().from(stores).where(eq(stores.id, rows[0].storeId)).limit(1);
  if (!st.length || st[0].ownerId !== session.id) return NextResponse.json({ error: "Not your store" }, { status: 403 });
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["title", "description", "videoUrl", "thumbnailUrl", "status", "season"]) if (k in body) patch[k] = body[k];
  const updated = await db.update(promos).set(patch).where(eq(promos.id, id)).returning();
  return NextResponse.json({ promo: updated[0] });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(promos).where(eq(promos.id, id)).limit(1);
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const st = await db.select().from(stores).where(eq(stores.id, rows[0].storeId)).limit(1);
  if (!st.length || st[0].ownerId !== session.id) return NextResponse.json({ error: "Not your store" }, { status: 403 });
  await db.delete(promos).where(eq(promos.id, id));
  return NextResponse.json({ ok: true });
}
