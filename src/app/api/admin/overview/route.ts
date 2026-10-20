import { count, eq, gte, ne, sum } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, orders, payments, stores, supportTickets, users, wholesalers } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const dayAgo = new Date(Date.now() - 86400000);
  const [[u], [s], [w], [o], [pending], [open], [paid], [rev]] = await Promise.all([
    db.select({ n: count() }).from(users).where(ne(users.role, "admin")),
    db.select({ n: count() }).from(stores),
    db.select({ n: count() }).from(wholesalers),
    db.select({ n: count() }).from(orders).where(gte(orders.createdAt, dayAgo)),
    db.select({ n: count() }).from(adCampaigns).where(eq(adCampaigns.status, "requested")),
    db.select({ n: count() }).from(supportTickets).where(eq(supportTickets.status, "open")),
    db.select({ n: count() }).from(payments),
    db.select({ t: sum(payments.amount) }).from(payments),
  ]);
  return ok({
    users: u.n,
    stores: s.n,
    wholesalers: w.n,
    ordersLast24h: o.n,
    pendingAdRequests: pending.n,
    openTickets: open.n,
    payments: paid.n,
    revenue: num(rev.t as string | null),
  });
});
