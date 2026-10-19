import { NextResponse } from "next/server";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { desc, ilike, or, eq, and } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city")?.trim();
  const openOnly = searchParams.get("open") === "1";

  let rows = await db.select().from(stores).orderBy(desc(stores.createdAt));
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(
      (s) =>
        s.shopName.toLowerCase().includes(lq) ||
        (s.description ?? "").toLowerCase().includes(lq) ||
        (s.city ?? "").toLowerCase().includes(lq) ||
        (s.category ?? "").toLowerCase().includes(lq)
    );
  }
  if (city && city !== "All") rows = rows.filter((s) => (s.city ?? "") === city);
  if (openOnly) rows = rows.filter((s) => s.isOpen);
  return NextResponse.json({ stores: rows });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (session.role !== "vendor") return NextResponse.json({ error: "Only vendors can create stores" }, { status: 403 });
  const body = await req.json();
  if (!body.shopName) return NextResponse.json({ error: "Shop name required" }, { status: 400 });
  const inserted = await db
    .insert(stores)
    .values({
      ownerId: session.id,
      shopName: String(body.shopName).slice(0, 160),
      description: body.description ? String(body.description) : null,
      dpUrl: body.dpUrl || null,
      phone: body.phone || null,
      whatsapp: body.whatsapp || body.phone || null,
      address: body.address || null,
      city: body.city || "New Delhi",
      category: body.category || "Grocery",
      isOpen: body.isOpen ?? true,
      nextOpeningAt: body.nextOpeningAt || null,
      nextClosingAt: body.nextClosingAt || null,
      openingHours: body.openingHours || "9:00 AM – 10:00 PM",
      deliveryAvailable: body.deliveryAvailable ?? true,
      pickupAvailable: body.pickupAvailable ?? true,
      deliveryFee: String(body.deliveryFee ?? "29"),
      deliveryRadiusKm: String(body.deliveryRadiusKm ?? "5"),
    })
    .returning();
  return NextResponse.json({ store: inserted[0] });
}
