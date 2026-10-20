import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db
    .select({ o: orders, s: stores })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .orderBy(desc(orders.createdAt))
    .limit(150);
  return ok({
    orders: rows.map((r) => ({
      id: r.o.id,
      shopName: r.s.shopName,
      customerName: r.o.customerName,
      fulfillment: r.o.fulfillment,
      status: r.o.status,
      total: num(r.o.total),
      createdAt: r.o.createdAt,
    })),
  });
});
