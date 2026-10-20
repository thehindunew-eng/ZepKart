import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { fail, ok, requireUser, route } from "@/lib/api";
import { num } from "@/lib/dto";
import { haversineKm, riderProgress } from "@/lib/tracking";
import { STATUS_LABEL } from "@/lib/order-status";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Live status for one booking. Customers see rider details. The store sees the same status but
 * no rider phone number. Pickup orders also return the store location for the customer's route.
 */
export const GET = route<Ctx>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) fail(404, "Booking not found");
  const [store] = await db.select().from(stores).where(eq(stores.id, o.storeId)).limit(1);
  const isCustomer = o.customerId === user.id;
  const isOwner = user.role === "vendor" && store?.ownerId === user.id;
  if (!isCustomer && !isOwner) fail(403, "Not allowed");

  const storePoint = store?.lat && store?.lng ? { lat: num(store.lat), lng: num(store.lng) } : null;
  const dest = o.destLat && o.destLng ? { lat: num(o.destLat), lng: num(o.destLng) } : null;
  const isDelivery = o.fulfillment === "delivery";
  const dispatched = isDelivery && o.status === "out_for_delivery" ? o.dispatchedAt : null;
  const progress = o.status === "completed" && isDelivery ? 1 : riderProgress(o.dispatchedAt, o.etaMinutes);

  let riderPos: { lat: number; lng: number } | null = null;
  if (isDelivery && storePoint && dest && o.dispatchedAt && (o.status === "out_for_delivery" || o.status === "completed")) {
    const t = o.status === "completed" ? 1 : progress;
    riderPos = { lat: storePoint.lat + (dest.lat - storePoint.lat) * t, lng: storePoint.lng + (dest.lng - storePoint.lng) * t };
  }
  const remainingKm = riderPos && dest ? haversineKm(riderPos, dest) : null;
  const etaLeft = dispatched ? Math.max(1, Math.ceil(o.etaMinutes * (1 - progress))) : null;

  let stage = STATUS_LABEL[o.status] ?? o.status;
  if (isDelivery && o.status === "out_for_delivery") stage = progress < 0.95 ? "Rider is on the way" : "Rider is at your door";
  if (!isDelivery && (o.status === "accepted" || o.status === "preparing")) stage = "Store is packing your order";
  if (!isDelivery && o.status === "ready") stage = "Ready for pickup. Head to the store.";

  return ok({
    id: o.id,
    status: o.status,
    fulfillment: o.fulfillment,
    stage,
    store: store ? { id: store.id, name: store.shopName, lat: storePoint?.lat ?? null, lng: storePoint?.lng ?? null, locality: store.locality } : null,
    destination: isDelivery ? dest : null,
    rider:
      isDelivery && o.riderName && (o.status === "out_for_delivery" || o.status === "completed")
        ? {
            name: o.riderName,
            vehicle: o.riderVehicle,
            // Only the customer gets the rider's number.
            phone: isCustomer ? o.riderPhone : null,
            position: riderPos,
            distanceKm: remainingKm,
            etaMinutes: o.status === "completed" ? 0 : etaLeft,
          }
        : null,
    progress: Math.round(progress * 100) / 100,
    updatedAt: new Date().toISOString(),
  });
});
