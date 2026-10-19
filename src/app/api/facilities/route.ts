import { NextResponse } from "next/server";
import { db } from "@/db";
import { facilities, stores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  let rows = await db.select().from(facilities).orderBy(desc(facilities.createdAt));
  if (storeId) rows = rows.filter((f) => f.storeId === storeId);
  return NextResponse.json({ facilities: rows });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json();
  if (!body.storeId || !body.title) return NextResponse.json({ error: "storeId and title required" }, { status: 400 });
  const own = await db.select().from(stores).where(eq(stores.id, body.storeId)).limit(1);
  if (!own.length || own[0].ownerId !== session.id) return NextResponse.json({ error: "Not your store" }, { status: 403 });
  const inserted = await db
    .insert(facilities)
    .values({
      storeId: body.storeId,
      title: String(body.title).slice(0, 160),
      description: body.description || null,
      price: String(body.price ?? "0"),
      unit: body.unit || "per visit",
      imageUrl: body.imageUrl || null,
      isActive: body.isActive ?? true,
    })
    .returning();
  return NextResponse.json({ facility: inserted[0] });
}
