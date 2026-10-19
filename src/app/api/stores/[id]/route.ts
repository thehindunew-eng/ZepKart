import { NextResponse } from "next/server";
import { db } from "@/db";
import { stores, products, facilities, promos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  if (!s.length) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  const store = s[0];
  const [inv, fac, ads] = await Promise.all([
    db.select().from(products).where(eq(products.storeId, id)),
    db.select().from(facilities).where(eq(facilities.storeId, id)),
    db.select().from(promos).where(eq(promos.storeId, id)),
  ]);
  return NextResponse.json({ store, products: inv, facilities: fac, promos: ads });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const existing = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  if (!existing.length) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  if (existing[0].ownerId !== session.id)
    return NextResponse.json({ error: "Only the owner can update this store" }, { status: 403 });
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  const allowed = [
    "shopName",
    "description",
    "dpUrl",
    "phone",
    "whatsapp",
    "address",
    "city",
    "category",
    "isOpen",
    "nextOpeningAt",
    "nextClosingAt",
    "openingHours",
    "deliveryAvailable",
    "pickupAvailable",
    "deliveryFee",
    "deliveryRadiusKm",
  ];
  for (const k of allowed) if (k in body) patch[k] = body[k];
  // normalize numerics to strings for numeric columns
  if ("deliveryFee" in patch) patch.deliveryFee = String(patch.deliveryFee ?? "0");
  if ("deliveryRadiusKm" in patch) patch.deliveryRadiusKm = String(patch.deliveryRadiusKm ?? "5");
  (patch as { updatedAt?: Date }).updatedAt = new Date();
  const updated = await db.update(stores).set(patch).where(eq(stores.id, id)).returning();
  return NextResponse.json({ store: updated[0] });
}
