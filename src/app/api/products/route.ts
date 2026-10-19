import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const q = searchParams.get("q")?.toLowerCase().trim();
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const featured = searchParams.get("featured");

  let rows = await db.select().from(products).orderBy(desc(products.updatedAt));
  if (storeId) rows = rows.filter((p) => p.storeId === storeId);
  if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  if (category && category !== "All") rows = rows.filter((p) => p.category === category);
  if (status && status !== "All") rows = rows.filter((p) => p.status === status);
  if (featured === "1") rows = rows.filter((p) => p.isFeatured);
  // attach store names
  const allStores = await db.select().from(stores);
  const map = new Map(allStores.map((s) => [s.id, s]));
  const enriched = rows.map((p) => ({ ...p, store: map.get(p.storeId) ?? null }));
  return NextResponse.json({ products: enriched });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json();
  if (!body.storeId || !body.name || body.price === undefined)
    return NextResponse.json({ error: "storeId, name and price required" }, { status: 400 });
  const own = await db.select().from(stores).where(eq(stores.id, body.storeId)).limit(1);
  if (!own.length) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  if (own[0].ownerId !== session.id) return NextResponse.json({ error: "Not your store" }, { status: 403 });
  const stockQty = Number(body.stockQty ?? 10);
  const status = body.status ?? (stockQty <= 0 ? "oos" : "available");
  const inserted = await db
    .insert(products)
    .values({
      storeId: body.storeId,
      name: String(body.name).slice(0, 160),
      description: body.description ? String(body.description) : null,
      imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
      price: String(body.price ?? "0"),
      mrp: String(body.mrp ?? body.price ?? "0"),
      weight: body.weight || "500g",
      weightUnit: body.weightUnit || "g",
      stockQty,
      status,
      category: body.category || "Staples",
      isFeatured: !!body.isFeatured,
    })
    .returning();
  return NextResponse.json({ product: inserted[0] });
}
