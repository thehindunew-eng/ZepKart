import { eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { adCampaigns, extraServices, featuredClips, messages, orderItems, orderServices, orders, payments, products, restockLines, restockRequests, stores, supportTickets, threads, users, wholesalerProducts, wholesalers } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { DEMO_ADMIN, DEMO_CAMPAIGNS, DEMO_CUSTOMERS, DEMO_STORES, DEMO_VENDORS, DEMO_WHOLESALERS } from "@/lib/seed-data";
import { gstInclusive, premiumQuote, quoteAd } from "@/lib/pricing";
import { geoFor, locateByPincode } from "@/lib/ncr";
import { istAt, istParts } from "@/lib/time";

const VENDOR_PASSWORD = "vendor123";
const CUSTOMER_PASSWORD = "customer123";
const WHOLESALER_PASSWORD = "wholesaler123";
const ADMIN_PASSWORD = "admin123";
/** Index of the demo store that starts on the Premium plan (FreshDaily Kirana, vendor1). */
const PREMIUM_STORE = 0;

/** Next occurrence of an IST wall-clock time at least 30 minutes away. */
function nextTimeAt(now: Date, h: number, m = 0) {
  const t = istAt(now, 0, h, m);
  return t.getTime() > now.getTime() + 30 * 60000 ? t : istAt(now, 1, h, m);
}

const ref = () => `ZK${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;

/**
 * Inserts realistic NCR demo data once. Safe to call repeatedly: it does nothing
 * if the demo vendor account already exists.
 */
export async function seedDemo() {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_VENDORS[0].email)).limit(1);
  if (existing) return { seeded: false as const };

  const now = new Date();
  const month = istParts(now).m;
  const vendorHash = await hashPassword(VENDOR_PASSWORD);
  const customerHash = await hashPassword(CUSTOMER_PASSWORD);
  const wholesalerHash = await hashPassword(WHOLESALER_PASSWORD);
  const adminHash = await hashPassword(ADMIN_PASSWORD);

  await db.transaction(async (tx) => {
    const vendors = await tx
      .insert(users)
      .values(DEMO_VENDORS.map((v) => ({ email: v.email, name: v.name, phone: v.phone, role: "vendor", passwordHash: vendorHash })))
      .returning();
    const customers = await tx
      .insert(users)
      .values(DEMO_CUSTOMERS.map((c) => ({ email: c.email, name: c.name, phone: c.phone, role: "customer", passwordHash: customerHash })))
      .returning();

    await tx.insert(users).values({ email: DEMO_ADMIN.email, name: DEMO_ADMIN.name, phone: DEMO_ADMIN.phone, role: "admin", passwordHash: adminHash });

    const wholesalerUsers = await tx
      .insert(users)
      .values(DEMO_WHOLESALERS.map((w) => ({ email: w.email, name: w.name, phone: w.phone, role: "wholesaler", passwordHash: wholesalerHash })))
      .returning();

    // Stores
    const storeRows: (typeof stores.$inferSelect)[] = [];
    for (const [idx, s] of DEMO_STORES.entries()) {
      const isOpen = s.schedule !== "closed-until-tomorrow";
      const geo = geoFor(s.city, s.locality, idx + 1);
      const [row] = await tx
        .insert(stores)
        .values({
          ownerId: vendors[s.owner].id,
          shopName: s.shopName,
          description: s.description,
          dpUrl: s.dp,
          coverUrl: s.dp,
          phone: DEMO_VENDORS[s.owner].phone,
          whatsapp: DEMO_VENDORS[s.owner].phone,
          address: s.address,
          locality: s.locality,
          city: s.city,
          pincode: s.pincode,
          category: s.category,
          isOpen,
          nextClosingAt: s.schedule === "closing-tonight" ? nextTimeAt(now, 21, 30) : null,
          nextOpeningAt: s.schedule === "closed-until-tomorrow" ? istAt(now, 1, 8, 0) : null,
          openingHours: "8:00 AM – 10:00 PM",
          pickupAvailable: true,
          deliveryAvailable: true,
          deliveryFee: String(s.deliveryFee),
          freeDeliveryAbove: String(s.freeDeliveryAbove),
          minOrder: String(s.minOrder),
          etaMinutes: s.etaMinutes,
          rating: String(s.rating),
          lat: String(geo.lat),
          lng: String(geo.lng),
          plan: idx === PREMIUM_STORE ? "premium" : "basic",
          planExpiresAt: idx === PREMIUM_STORE ? new Date(now.getTime() + 25 * 86400000) : null,
        })
        .returning();
      storeRows.push(row);
    }

    // Wholesalers and their catalogs
    const wholesalerRows: (typeof wholesalers.$inferSelect)[] = [];
    for (const [i, w] of DEMO_WHOLESALERS.entries()) {
      const geo = geoFor(w.city, w.locality, i + 1);
      const [row] = await tx
        .insert(wholesalers)
        .values({
          userId: wholesalerUsers[i].id,
          businessName: w.businessName,
          description: w.description,
          gstin: w.gstin,
          phone: w.phone,
          locality: w.locality,
          city: w.city,
          pincode: w.pincode,
          lat: String(geo.lat),
          lng: String(geo.lng),
          rating: String(w.rating),
          ratingCount: w.ratingCount,
        })
        .returning();
      wholesalerRows.push(row);
      await tx.insert(wholesalerProducts).values(
        w.catalog.map((c) => ({
          wholesalerId: row.id,
          name: c.name,
          category: c.category,
          weightValue: String(c.weightValue),
          weightUnit: c.weightUnit,
          price: String(c.price),
          moq: c.moq,
          stockQty: c.stockQty,
          grade: c.grade,
          inStock: c.stockQty > 0,
        })),
      );
    }

    // Products and services
    const productIds = new Map<string, string>();
    for (let i = 0; i < DEMO_STORES.length; i++) {
      const s = DEMO_STORES[i];
      for (const p of s.products) {
        const [row] = await tx
          .insert(products)
          .values({
            storeId: storeRows[i].id,
            name: p.name,
            description: p.description,
            imageUrl: p.image,
            category: p.category,
            price: String(p.price),
            mrp: String(p.mrp),
            weightValue: String(p.weightValue),
            weightUnit: p.weightUnit,
            stockQty: p.stockQty,
            inStock: p.inStock ?? true,
            bargainEnabled: !!p.bargain,
            floorPrice: p.bargain ? String(p.bargain.floor) : null,
            costPrice: p.costPrice == null ? null : String(p.costPrice),
            gstRate: p.gstRate,
          })
          .returning();
        productIds.set(`${i}:${p.name}`, row.id);
      }
      for (const sv of s.services) {
        await tx.insert(extraServices).values({
          storeId: storeRows[i].id,
          title: sv.title,
          description: sv.description,
          price: String(sv.price),
          unitLabel: sv.unitLabel,
          gstRate: sv.gstRate,
          isActive: true,
        });
      }
    }
    const pid = (store: number, name: string) => {
      const id = productIds.get(`${store}:${name}`);
      if (!id) throw new Error(`seed: missing product ${name}`);
      return id;
    };
    const svcId = async (store: number, title: string) => {
      const [r] = await tx
        .select({ id: extraServices.id })
        .from(extraServices)
        .where(sql`${extraServices.storeId} = ${storeRows[store].id} and ${extraServices.title} = ${title}`)
        .limit(1);
      return r.id;
    };

    // Premium plan purchase for the premium store
    const planQuote = premiumQuote();
    await tx.insert(payments).values({
      userId: vendors[DEMO_STORES[PREMIUM_STORE].owner].id,
      storeId: storeRows[PREMIUM_STORE].id,
      purpose: "plan",
      amount: String(planQuote.total),
      method: "upi",
      reference: ref(),
      maskedDetails: "UPI · ve***@okaxis",
      status: "succeeded",
      createdAt: new Date(now.getTime() - 5 * 86400000),
    });

    // Restock: an open request to one wholesaler and a quoted request to another
    const restockFor = async (wIndex: number, status: string, lines: { name: string; qty: number; lastCost?: number; quote?: { price: number; qty: number } }[]) => {
      const [req] = await tx
        .insert(restockRequests)
        .values({ storeId: storeRows[PREMIUM_STORE].id, wholesalerId: wholesalerRows[wIndex].id, status, createdAt: new Date(now.getTime() - 3 * 3600000) })
        .returning();
      const product = (name: string) => DEMO_STORES[PREMIUM_STORE].products.find((p) => p.name === name);
      for (const l of lines) {
        const p = product(l.name);
        await tx.insert(restockLines).values({
          requestId: req.id,
          productId: p ? productIds.get(`${PREMIUM_STORE}:${l.name}`) ?? null : null,
          itemName: l.name,
          weightLabel: p ? `${p.weightValue} ${p.weightUnit}` : null,
          qty: l.qty,
          lastCost: l.lastCost == null ? null : String(l.lastCost),
          quotePrice: l.quote ? String(l.quote.price) : null,
          quoteQty: l.quote ? l.quote.qty : null,
          status: l.quote ? "quoted" : "requested",
        });
      }
    };
    await restockFor(0, "open", [
      { name: "Robusta Bananas", qty: 20, lastCost: 34 },
      { name: "Basmati Rice Premium", qty: 4, lastCost: 560 },
    ]);
    await restockFor(3, "quoted", [
      { name: "Robusta Bananas", qty: 30, lastCost: 34, quote: { price: 40, qty: 30 } },
      { name: "Basmati Rice Premium", qty: 4, lastCost: 560, quote: { price: 585, qty: 4 } },
    ]);

    // Ad campaigns with mock payments (live: active right now)
    for (const [ci, c] of DEMO_CAMPAIGNS.entries()) {
      const startsAt = new Date(now.getTime() - c.daysAgo * 86400000);
      const endsAt = new Date(startsAt.getTime() + c.planDays * 86400000);
      const q = quoteAd({ durationSec: c.durationSec, planDays: c.planDays, activeCampaigns: 3, month });
      const [camp] = await tx
        .insert(adCampaigns)
        .values({
          storeId: storeRows[c.store].id,
          title: c.title,
          description: c.description,
          videoUrl: c.videoUrl,
          durationSec: c.durationSec,
          planDays: c.planDays,
          seasonName: q.seasonName,
          seasonMultiplier: String(q.seasonMultiplier),
          demandMultiplier: String(q.demandMultiplier),
          lengthFactor: String(q.lengthFactor),
          planDiscountPct: String(q.planDiscountPct),
          baseAmount: String(q.base),
          discountAmount: String(q.discount),
          taxableAmount: String(q.taxable),
          gstAmount: String(q.gst),
          total: String(q.total),
          status: "active",
          startsAt,
          endsAt,
          createdAt: startsAt,
        })
        .returning();
      await tx.insert(payments).values({
        userId: vendors[DEMO_STORES[c.store].owner].id,
        storeId: storeRows[c.store].id,
        campaignId: camp.id,
        purpose: "ad",
        amount: String(q.total),
        method: "upi",
        reference: ref(),
        maskedDetails: "UPI · ve***@okaxis",
        status: "succeeded",
        createdAt: startsAt,
      });
      // Approved campaigns appear in Featured.
      await tx.insert(featuredClips).values({
        title: c.title,
        subtitle: DEMO_STORES[c.store].shopName,
        videoUrl: c.videoUrl,
        durationSec: c.durationSec,
        storeId: storeRows[c.store].id,
        campaignId: camp.id,
        sortOrder: ci,
        isActive: true,
        endsAt,
        createdAt: startsAt,
      });
    }

    // Paid ad requests waiting in the admin queue: one vendor, one wholesaler.
    const pendingAds = [
      { storeIdx: 2, wholesalerIdx: -1, title: "Dairy & bakery this weekend", videoUrl: "/demo-ads/clip-dairy-bakery.mp4", planDays: 7, durationSec: 12 },
      { storeIdx: -1, wholesalerIdx: 0, title: "Bulk basmati for shop owners", videoUrl: "/demo-ads/clip-weekend-deals.mp4", planDays: 15, durationSec: 12 },
    ];
    for (const p of pendingAds) {
      const q = quoteAd({ durationSec: p.durationSec, planDays: p.planDays, activeCampaigns: 3, month });
      const [req] = await tx
        .insert(adCampaigns)
        .values({
          storeId: p.storeIdx >= 0 ? storeRows[p.storeIdx].id : null,
          wholesalerId: p.wholesalerIdx >= 0 ? wholesalerRows[p.wholesalerIdx].id : null,
          requesterId: p.storeIdx >= 0 ? vendors[DEMO_STORES[p.storeIdx].owner].id : wholesalerUsers[p.wholesalerIdx].id,
          title: p.title,
          videoUrl: p.videoUrl,
          durationSec: p.durationSec,
          planDays: q.planDays,
          seasonName: q.seasonName,
          seasonMultiplier: String(q.seasonMultiplier),
          demandMultiplier: String(q.demandMultiplier),
          lengthFactor: String(q.lengthFactor),
          planDiscountPct: String(q.planDiscountPct),
          baseAmount: String(q.base),
          discountAmount: String(q.discount),
          taxableAmount: String(q.taxable),
          gstAmount: String(q.gst),
          total: String(q.total),
          status: "requested",
          createdAt: new Date(now.getTime() - 3600000),
        })
        .returning();
      await tx.insert(payments).values({
        userId: req.requesterId,
        storeId: req.storeId,
        wholesalerId: req.wholesalerId,
        campaignId: req.id,
        purpose: "ad",
        amount: String(q.total),
        method: "upi",
        reference: ref(),
        maskedDetails: "UPI · ad***@okicici",
        status: "succeeded",
      });
    }

    await tx.insert(supportTickets).values({
      userId: customers[1].id,
      name: DEMO_CUSTOMERS[1].name,
      contact: DEMO_CUSTOMERS[1].phone,
      topic: "delivery",
      message: "My delivery arrived 10 minutes after the window. Can the rider share an updated ETA next time?",
    });

    // Bookings across the status flow
    type Seed = {
      customer: number;
      store: number;
      status: string;
      fulfillment: "pickup" | "delivery";
      items: [string, number][];
      services?: [string, number][];
      address?: string;
      pincode?: string;
      ago: number;
      reject?: string;
    };
    const plan: Seed[] = [
      { customer: 0, store: 0, status: "out_for_delivery", fulfillment: "delivery", items: [["Whole Wheat Atta", 1], ["A2 Cow Milk", 2]], address: "B-42, Sarvodaya Enclave, New Delhi", pincode: "110017", ago: 25 },
      { customer: 1, store: 4, status: "ready", fulfillment: "pickup", items: [["Onion", 2], ["Potato", 1]], ago: 40 },
      { customer: 2, store: 1, status: "new", fulfillment: "pickup", items: [["Fresh Paneer", 2], ["Sourdough Loaf", 1]], services: [["Cake box & ribbon", 1]], ago: 4 },
      { customer: 0, store: 5, status: "completed", fulfillment: "delivery", items: [["Organic Atta", 1], ["Organic Brown Eggs", 1]], services: [["Organic gift hamper", 1]], address: "B-42, Sarvodaya Enclave, New Delhi", pincode: "110017", ago: 1440 * 2 },
      { customer: 2, store: 0, status: "rejected", fulfillment: "pickup", items: [["Robusta Bananas", 2]], ago: 180, reject: "Bananas sold out this morning" },
    ];

    for (const o of plan) {
      const createdAt = new Date(now.getTime() - o.ago * 60000);
      let subtotal = 0;
      let gst = 0;
      const lines = o.items.map(([name, qty]) => {
        const storeIdx = o.store;
        const prod = DEMO_STORES[storeIdx].products.find((p) => p.name === name)!;
        const lineTotal = prod.price * qty;
        subtotal += lineTotal;
        const g = gstInclusive(lineTotal, prod.gstRate);
        gst += g;
        return { name, qty, prod, lineTotal, g, id: pid(storeIdx, name) };
      });
      let servicesTotal = 0;
      const svcLines = [];
      for (const [title, qty] of o.services ?? []) {
        const sv = DEMO_STORES[o.store].services.find((s) => s.title === title)!;
        const lineTotal = sv.price * qty;
        servicesTotal += lineTotal;
        gst += gstInclusive(lineTotal, sv.gstRate);
        svcLines.push({ title, qty, sv, lineTotal, id: await svcId(o.store, title) });
      }
      const st = DEMO_STORES[o.store];
      const fee = o.fulfillment === "delivery" && subtotal + servicesTotal < st.freeDeliveryAbove ? st.deliveryFee : 0;
      gst += gstInclusive(fee, 18);
      const total = Math.round((subtotal + servicesTotal + fee) * 100) / 100;
      const [order] = await tx
        .insert(orders)
        .values({
          storeId: storeRows[o.store].id,
          customerId: customers[o.customer].id,
          customerName: DEMO_CUSTOMERS[o.customer].name,
          phone: DEMO_CUSTOMERS[o.customer].phone,
          fulfillment: o.fulfillment,
          address: o.address ?? null,
          pincode: o.pincode ?? null,
          status: o.status,
          subtotal: String(subtotal),
          servicesTotal: String(servicesTotal),
          deliveryFee: String(fee),
          gstAmount: String(Math.round(gst * 100) / 100),
          total: String(total),
          rejectReason: o.reject ?? null,
          etaMinutes: st.etaMinutes,
          createdAt,
          updatedAt: createdAt,
          ...(o.fulfillment === "delivery" && o.pincode && locateByPincode(o.pincode)
            ? { destLat: String(locateByPincode(o.pincode)!.lat), destLng: String(locateByPincode(o.pincode)!.lng) }
            : {}),
          // Demo rider already on the way (dispatched 4 minutes ago) so Track shows live progress.
          ...(o.status === "out_for_delivery"
            ? { dispatchedAt: new Date(now.getTime() - 4 * 60000), riderName: "Ravi Kumar", riderVehicle: "Bike · Honda Activa", riderPhone: "9811223344" }
            : {}),
        })
        .returning();
      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: l.id,
          name: l.name,
          unitPrice: String(l.prod.price),
          listPrice: String(l.prod.price),
          qty: l.qty,
          gstRate: l.prod.gstRate,
          gstAmount: String(Math.round(l.g * 100) / 100),
          lineTotal: String(l.lineTotal),
          agreed: false,
        })),
      );
      if (svcLines.length) {
        await tx.insert(orderServices).values(
          svcLines.map((s) => ({
            orderId: order.id,
            serviceId: s.id,
            title: s.title,
            unitPrice: String(s.sv.price),
            qty: s.qty,
            gstRate: s.sv.gstRate,
            gstAmount: String(Math.round(gstInclusive(s.lineTotal, s.sv.gstRate) * 100) / 100),
            lineTotal: String(s.lineTotal),
          })),
        );
      }
      // Reserve stock for every booking that is still live.
      if (!["rejected", "cancelled"].includes(o.status)) {
        for (const l of lines) {
          await tx.update(products).set({ stockQty: sql`greatest(${products.stockQty} - ${l.qty}, 0)` }).where(eq(products.id, l.id));
        }
      }
    }

    // Chats: one thread per item per customer
    const addMsg = async (threadId: string, senderId: string | null, kind: string, data: { content?: string; price?: number; mode?: string; state?: string }, at: Date) => {
      await tx.insert(messages).values({
        threadId,
        senderId,
        kind,
        content: data.content ?? null,
        price: data.price == null ? null : String(data.price),
        mode: data.mode ?? null,
        state: data.state ?? "none",
        createdAt: at,
      });
    };
    const openThread = async (store: number, product: string, customer: number, extra: Partial<typeof threads.$inferInsert> = {}) => {
      const [t] = await tx
        .insert(threads)
        .values({ storeId: storeRows[store].id, productId: pid(store, product), customerId: customers[customer].id, ...extra })
        .returning();
      return t;
    };
    const ownerOf = (store: number) => vendors[DEMO_STORES[store].owner].id;
    const minsAgo = (m: number) => new Date(now.getTime() - m * 60000);

    // Auto-accepted bargain (offer at the hidden floor) -> agreed price for 24h
    const t1 = await openThread(0, "Desi Tomatoes", 0, { status: "agreed", agreedPrice: "30", agreedUntil: new Date(now.getTime() + 20 * 3600000), customerUnread: 0, vendorUnread: 1, lastMessageAt: minsAgo(12) });
    await addMsg(t1.id, customers[0].id, "text", { content: "Hi! Are the tomatoes fresh today? Can you do ₹30 a kg for 1 kg?" }, minsAgo(15));
    await addMsg(t1.id, customers[0].id, "offer", { price: 30, state: "accepted" }, minsAgo(14));
    await addMsg(t1.id, null, "system", { content: "Offer accepted at ₹30. Book within 24 hours to lock this price." }, minsAgo(14));
    await addMsg(t1.id, customers[0].id, "text", { content: "Great, I'll book it for delivery." }, minsAgo(12));

    // Pending offer below the floor plus a pickup request
    const t2 = await openThread(2, "Organic Veggie Box", 1, { customerUnread: 0, vendorUnread: 2, lastMessageAt: minsAgo(6) });
    await addMsg(t2.id, customers[1].id, "text", { content: "Can I pick up the veggie box in the evening? Would ₹330 work?" }, minsAgo(8));
    await addMsg(t2.id, customers[1].id, "offer", { price: 330, state: "pending" }, minsAgo(7));
    await addMsg(t2.id, customers[1].id, "fulfillment", { mode: "pickup", state: "pending", content: "Pickup after 6 PM" }, minsAgo(6));

    // Friendly store reply on the paneer chat
    const t3 = await openThread(1, "Fresh Paneer", 2, { customerUnread: 1, vendorUnread: 0, lastMessageAt: minsAgo(3) });
    await addMsg(t3.id, customers[2].id, "text", { content: "Is the paneer fresh? Can you pack 2 blocks for pickup?" }, minsAgo(5));
    await addMsg(t3.id, ownerOf(1), "text", { content: "Yes, cut this morning. Packed and chilled for you. Show this chat at the counter." }, minsAgo(3));

    // Customer asks about a product with a pending pickup request
    const t4 = await openThread(5, "Organic Atta", 0, { customerUnread: 0, vendorUnread: 0, lastMessageAt: minsAgo(60 * 24) });
    await addMsg(t4.id, customers[0].id, "text", { content: "Is the organic atta stone-ground?" }, minsAgo(60 * 24 + 5));
    await addMsg(t4.id, ownerOf(5), "text", { content: "Yes, stone-ground and certified. Happy to help with a bulk order." }, minsAgo(60 * 24 + 2));
  });

  return { seeded: true as const };
}
