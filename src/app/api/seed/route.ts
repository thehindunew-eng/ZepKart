import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, stores, products, facilities, promos, threads, messages, orders } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { DEMO_USERS, DEMO_STORES, DEMO_PRODUCTS, DEMO_FACILITIES, DEMO_PROMOS } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = await db.select({ n: count() }).from(users);
  return NextResponse.json({ users: c[0]?.n ?? 0, seeded: (c[0]?.n ?? 0) > 0 });
}

export async function POST() {
  try {
    const existing = await db.select({ n: count() }).from(users);
    if ((existing[0]?.n ?? 0) > 2) {
      return NextResponse.json({ ok: true, skipped: true, message: "Already seeded" });
    }
    // users
    const userIdByEmail = new Map<string, string>();
    for (const u of DEMO_USERS) {
      const found = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
      if (found.length) {
        userIdByEmail.set(u.email, found[0].id);
        continue;
      }
      const inserted = await db
        .insert(users)
        .values({
          email: u.email,
          passwordHash: await hashPassword(u.password),
          name: u.name,
          phone: u.phone,
          role: u.role,
          avatarUrl: u.avatarUrl,
        })
        .returning();
      userIdByEmail.set(u.email, inserted[0].id);
    }
    const vendorEmails = ["vendor1@zapkart.demo", "vendor2@zapkart.demo", "vendor3@zapkart.demo", "vendor4@zapkart.demo"];
    const storeIdByKey = new Map<string, string>();
    for (let i = 0; i < DEMO_STORES.length; i++) {
      const s = DEMO_STORES[i];
      const ownerEmail = vendorEmails[i];
      const ownerId = userIdByEmail.get(ownerEmail)!;
      const found = await db.select().from(stores).where(eq(stores.ownerId, ownerId)).limit(1);
      if (found.length) {
        storeIdByKey.set(s.key, found[0].id);
        continue;
      }
      const inserted = await db
        .insert(stores)
        .values({
          ownerId,
          shopName: s.shopName,
          description: s.description,
          dpUrl: s.dpUrl,
          phone: s.phone,
          whatsapp: s.whatsapp,
          address: s.address,
          city: s.city,
          category: s.category,
          isOpen: s.isOpen,
          nextOpeningAt: s.nextOpeningAt,
          nextClosingAt: s.nextClosingAt,
          openingHours: s.openingHours,
          deliveryAvailable: true,
          pickupAvailable: true,
          deliveryFee: s.deliveryFee,
          deliveryRadiusKm: s.deliveryRadiusKm,
          rating: s.rating,
          totalOrders: 40 + i * 37,
        })
        .returning();
      storeIdByKey.set(s.key, inserted[0].id);
    }
    // products
    for (const p of DEMO_PRODUCTS) {
      const storeId = storeIdByKey.get(p.storeKey)!;
      await db.insert(products).values({
        storeId,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        price: p.price,
        mrp: p.mrp,
        weight: p.weight,
        category: p.category,
        stockQty: p.stockQty,
        status: p.status,
        isFeatured: p.isFeatured,
      });
    }
    for (const f of DEMO_FACILITIES) {
      const storeId = storeIdByKey.get(f.storeKey)!;
      await db.insert(facilities).values({
        storeId,
        title: f.title,
        description: f.description,
        price: f.price,
        unit: f.unit,
        imageUrl: f.imageUrl,
        isActive: true,
      });
    }
    for (const pr of DEMO_PROMOS) {
      const storeId = storeIdByKey.get(pr.storeKey)!;
      await db.insert(promos).values({
        storeId,
        title: pr.title,
        description: pr.description,
        videoUrl: pr.videoUrl,
        thumbnailUrl: pr.thumbnailUrl,
        durationSec: 60,
        season: pr.season,
        amountPaid: pr.amountPaid,
        status: "active",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 5 * 86400000),
      });
    }
    // demo threads + messages + orders for liveliness
    const custId = userIdByEmail.get("customer@zapkart.demo")!;
    const saraId = userIdByEmail.get("sara@zapkart.demo")!;
    const allProducts = await db.select().from(products).limit(6);
    if (allProducts.length >= 2) {
      const t1 = await db
        .insert(threads)
        .values({
          productId: allProducts[0].id,
          storeId: allProducts[0].storeId,
          customerId: custId,
          type: "bargain",
          offerPrice: String(Math.max(1, Number(allProducts[0].price) - 5)),
          fulfillment: "delivery",
          status: "open",
        })
        .returning();
      await db.insert(messages).values([
        { threadId: t1[0].id, senderId: custId, content: `Hi! Is ${allProducts[0].name} fresh today? Can you do ₹${Math.max(1, Number(allProducts[0].price) - 5)} for 2 kg with delivery?`, offerPrice: String(Math.max(1, Number(allProducts[0].price) - 5)) },
        { threadId: t1[0].id, senderId: (await db.select().from(stores).where(eq(stores.id, allProducts[0].storeId)).limit(1))[0]?.ownerId ?? custId, content: "Hello! Yes, morning stock just arrived. I can do that price for pickup, delivery +₹19. Shall I pack 2 kg?" },
      ]);
      const t2 = await db
        .insert(threads)
        .values({
          productId: allProducts[1].id,
          storeId: allProducts[1].storeId,
          customerId: saraId,
          type: "pickup",
          fulfillment: "pickup",
          status: "open",
        })
        .returning();
      await db.insert(messages).values([
        { threadId: t2[0].id, senderId: saraId, content: "Can I pick this up in 30 mins? Please keep it chilled." },
        { threadId: t2[0].id, senderId: (await db.select().from(stores).where(eq(stores.id, allProducts[1].storeId)).limit(1))[0]?.ownerId ?? saraId, content: "Done! Packed & chilled. Show this chat at counter for express pickup." },
      ]);
      await db.insert(orders).values([
        {
          storeId: allProducts[0].storeId,
          productId: allProducts[0].id,
          customerId: custId,
          customerName: "Aarav Sharma",
          qty: 2,
          unitPrice: String(allProducts[0].price),
          total: String(Number(allProducts[0].price) * 2 + 19),
          fulfillment: "delivery",
          status: "out_for_delivery",
          phone: "9998887776",
          address: "B-42, Green Park, New Delhi",
          note: "Ring bell twice",
        },
        {
          storeId: allProducts[1].storeId,
          productId: allProducts[1].id,
          customerId: saraId,
          customerName: "Sara Thomas",
          qty: 1,
          unitPrice: String(allProducts[1].price),
          total: String(allProducts[1].price),
          fulfillment: "pickup",
          status: "ready",
          phone: "9998887775",
          address: "Pickup from store",
          note: "Express pickup",
        },
      ]);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("seed failed", e);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
