import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products, stores, facilities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  let rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  if (session.role === "customer") rows = rows.filter((o) => o.customerId === session.id);
  else if (session.role === "vendor") {
    const myStores = await db.select().from(stores).where(eq(stores.ownerId, session.id));
    const ids = new Set(myStores.map((s) => s.id));
    rows = rows.filter((o) => ids.has(o.storeId));
  }
  if (storeId) rows = rows.filter((o) => o.storeId === storeId);

  const allProducts = await db.select().from(products);
  const pmap = new Map(allProducts.map((p) => [p.id, p]));
  const allStores = await db.select().from(stores);
  const smap = new Map(allStores.map((s) => [s.id, s]));
  const allFac = await db.select().from(facilities);
  const fmap = new Map(allFac.map((f) => [f.id, f]));
  return NextResponse.json({
    orders: rows.slice(0, 200).map((o) => ({
      ...o,
      product: o.productId ? pmap.get(o.productId) ?? null : null,
      store: smap.get(o.storeId) ?? null,
      facility: o.facilityId ? fmap.get(o.facilityId) ?? null : null,
    })),
  });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json();
  const { storeId, productId, facilityId, qty, fulfillment, phone, address, note, unitPrice } = body;
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const q = Math.max(1, Math.min(50, Number(qty ?? 1)));
  let price = Number(unitPrice ?? 0);
  let title = "";
  if (productId) {
    const p = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!p.length) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (p[0].status === "oos") return NextResponse.json({ error: "Item is out of stock right now" }, { status: 400 });
    if (p[0].stockQty < q) return NextResponse.json({ error: `Only ${p[0].stockQty} left in stock` }, { status: 400 });
    price = Number(p[0].price);
    title = p[0].name;
    // decrement stock optimistically
    await db.update(products).set({ stockQty: p[0].stockQty - q, status: p[0].stockQty - q <= 0 ? "oos" : p[0].status, updatedAt: new Date() }).where(eq(products.id, productId));
  } else if (facilityId) {
    const f = await db.select().from(facilities).where(eq(facilities.id, facilityId)).limit(1);
    if (!f.length) return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    price = Number(f[0].price);
    title = f[0].title;
  }
  if (body.bargainPrice) price = Number(body.bargainPrice);
  const st = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  const fee = fulfillment === "delivery" ? Number(st[0]?.deliveryFee ?? 0) : 0;
  const total = price * q + fee;
  const inserted = await db
    .insert(orders)
    .values({
      storeId,
      productId: productId || null,
      facilityId: facilityId || null,
      customerId: session.id,
      customerName: session.name,
      qty: q,
      unitPrice: String(price),
      total: String(total),
      fulfillment: fulfillment || "delivery",
      status: "pending",
      phone: phone || session.phone || null,
      address: address || null,
      note: note ? `${title ? title + " — " : ""}${String(note)}` : title || null,
    })
    .returning();
  return NextResponse.json({ order: inserted[0] });
}
