import { NextResponse } from "next/server";
import { db } from "@/db";
import { promos, stores } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";
import { adPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  let rows = await db.select().from(promos).orderBy(desc(promos.createdAt));
  if (storeId) rows = rows.filter((p) => p.storeId === storeId);
  const allStores = await db.select().from(stores);
  const map = new Map(allStores.map((s) => [s.id, s]));
  return NextResponse.json({ promos: rows.map((p) => ({ ...p, store: map.get(p.storeId) ?? null })) });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json();
  if (!body.storeId || !body.title) return NextResponse.json({ error: "storeId and title required" }, { status: 400 });
  if (!body.videoUrl) return NextResponse.json({ error: "Video URL required (max 1 min)" }, { status: 400 });
  const own = await db.select().from(stores).where(eq(stores.id, body.storeId)).limit(1);
  if (!own.length || own[0].ownerId !== session.id) return NextResponse.json({ error: "Not your store" }, { status: 403 });
  const season = body.season || "Normal";
  const days = Math.max(1, Math.min(30, Number(body.days ?? 3)));
  const durationSec = Math.min(70, Math.max(5, Number(body.durationSec ?? 60)));
  if (durationSec > 70) return NextResponse.json({ error: "Video must be under ~1 minute" }, { status: 400 });
  const amount = adPrice(season, days);
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + days * 86400000);
  const inserted = await db
    .insert(promos)
    .values({
      storeId: body.storeId,
      title: String(body.title).slice(0, 180),
      description: body.description || null,
      videoUrl: String(body.videoUrl),
      thumbnailUrl: body.thumbnailUrl || own[0].dpUrl,
      durationSec,
      season,
      amountPaid: String(amount),
      status: "active",
      startsAt,
      endsAt,
    })
    .returning();
  return NextResponse.json({ promo: inserted[0], charged: amount });
}
