import { and, desc, eq, gte, inArray, sql, gt } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, orders, products, threads } from "@/db/schema";
import { ok, requireVendor, route } from "@/lib/api";
import { num, vendorStore, isAvailable } from "@/lib/dto";
import { refreshStore } from "@/lib/store-status";
import { istAt } from "@/lib/time";
import { demandMultiplier, seasonForMonth } from "@/lib/pricing";
import { istParts } from "@/lib/time";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { store } = await requireVendor();
  const s = await refreshStore(store);
  const now = new Date();
  const startOfToday = istAt(now, 0, 0, 0);

  const [newBookings, todayRows, unread, recent, items, activeAd, activeCount] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(and(eq(orders.storeId, s.id), eq(orders.status, "new"))),
    db
      .select({ total: orders.total })
      .from(orders)
      .where(and(eq(orders.storeId, s.id), gte(orders.createdAt, startOfToday), inArray(orders.status, ["new", "accepted", "preparing", "ready", "out_for_delivery", "completed"]))),
    db.select({ n: sql<number>`coalesce(sum(${threads.vendorUnread}), 0)::int` }).from(threads).where(eq(threads.storeId, s.id)),
    db.select().from(orders).where(eq(orders.storeId, s.id)).orderBy(desc(orders.createdAt)).limit(5),
    db.select().from(products).where(eq(products.storeId, s.id)),
    db
      .select()
      .from(adCampaigns)
      .where(and(eq(adCampaigns.storeId, s.id), eq(adCampaigns.status, "active"), gt(adCampaigns.endsAt, now)))
      .orderBy(desc(adCampaigns.startsAt))
      .limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(adCampaigns).where(and(eq(adCampaigns.status, "active"), gt(adCampaigns.endsAt, now))),
  ]);

  const low = items.filter((p) => isAvailable(p) && p.stockQty <= 5).length;
  const oos = items.filter((p) => !isAvailable(p)).length;
  const month = istParts(now).m;
  const season = seasonForMonth(month);

  return ok({
    store: vendorStore(s),
    stats: {
      newBookings: newBookings[0]?.n ?? 0,
      todaySales: Math.round(todayRows.reduce((a, r) => a + num(r.total), 0) * 100) / 100,
      todayOrders: todayRows.length,
      unreadChats: unread[0]?.n ?? 0,
    },
    recentOrders: recent.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      fulfillment: o.fulfillment,
      status: o.status,
      total: num(o.total),
      createdAt: o.createdAt,
    })),
    inventory: {
      total: items.length,
      inStock: items.length - oos,
      low,
      outOfStock: oos,
    },
    ad: activeAd[0]
      ? { id: activeAd[0].id, title: activeAd[0].title, endsAt: activeAd[0].endsAt, status: "active" }
      : null,
    market: {
      activeCampaigns: activeCount[0]?.n ?? 0,
      demandMultiplier: demandMultiplier(activeCount[0]?.n ?? 0),
      season: season.name,
      seasonMultiplier: season.multiplier,
    },
  });
});
