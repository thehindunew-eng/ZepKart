import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { fail, ok, requireUser, route } from "@/lib/api";
import { orderAction } from "@/lib/validators";
import { NEXT_STATUS, restoreStock } from "@/lib/orders";
import { refreshStore } from "@/lib/store-status";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) fail(404, "Booking not found");
  const [store] = await db.select().from(stores).where(eq(stores.id, o.storeId)).limit(1);
  const isOwner = user.role === "vendor" && store?.ownerId === user.id;
  const isCustomer = o.customerId === user.id;
  if (!isOwner && !isCustomer) fail(403, "Not allowed");
  return ok({ id: o.id, status: o.status, total: num(o.total), fulfillment: o.fulfillment, createdAt: o.createdAt, updatedAt: o.updatedAt });
});

/** Vendor moves a booking forward; the customer can cancel while it is still new. */
export const PATCH = route<Ctx>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = orderAction.parse(await req.json());
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) fail(404, "Booking not found");
  const [storeRow] = await db.select().from(stores).where(eq(stores.id, o.storeId)).limit(1);

  if (body.action === "cancel") {
    if (o.customerId !== user.id) fail(403, "Not allowed");
    if (o.status !== "new") fail(409, "This booking can no longer be cancelled");
    await db.transaction(async (tx) => {
      await restoreStock(tx as never, o.id);
      await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, o.id));
    });
  } else {
    if (user.role !== "vendor" || storeRow?.ownerId !== user.id) fail(403, "Only the store can update this booking");
    await refreshStore(storeRow);
    const step = (NEXT_STATUS[o.status] ?? []).find((s) => s.action === body.action || (body.action === "complete" && s.action === "complete"));
    if (!step) fail(409, "This booking can't move to that step");
    if (body.action === "ready" && o.fulfillment !== "pickup") fail(409, "Delivery orders go out for delivery instead");
    if (body.action === "out_for_delivery" && o.fulfillment !== "delivery") fail(409, "Pickup orders are marked ready for pickup");
    if (body.action === "reject") {
      await db.transaction(async (tx) => {
        await restoreStock(tx as never, o.id);
        await tx
          .update(orders)
          .set({ status: "rejected", rejectReason: body.reason || null, updatedAt: new Date() })
          .where(eq(orders.id, o.id));
      });
    } else {
      await db.update(orders).set({ status: step.to, updatedAt: new Date() }).where(eq(orders.id, o.id));
    }
  }
  const [fresh] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return ok({ id: fresh.id, status: fresh.status, updatedAt: fresh.updatedAt });
});
