import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orderServices, orders, stores } from "@/db/schema";
import { fail, ok, requireUser, route } from "@/lib/api";
import { orderCreate } from "@/lib/validators";
import { createOrderRecord, priceOrder } from "@/lib/orders";
import { refreshStore } from "@/lib/store-status";
import { isNcrPincode } from "@/lib/ncr";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

async function withLines(list: (typeof orders.$inferSelect)[]) {
  if (!list.length) return [];
  const ids = list.map((o) => o.id);
  const [items, services, storeRows] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    db.select().from(orderServices).where(inArray(orderServices.orderId, ids)),
    db.select({ id: stores.id, shopName: stores.shopName, whatsapp: stores.whatsapp, locality: stores.locality, city: stores.city }).from(stores).where(inArray(stores.id, list.map((o) => o.storeId))),
  ]);
  return list.map((o) => ({
    id: o.id,
    storeId: o.storeId,
    store: storeRows.find((s) => s.id === o.storeId) ?? null,
    customerName: o.customerName,
    phone: o.phone,
    fulfillment: o.fulfillment,
    address: o.address,
    pincode: o.pincode,
    note: o.note,
    status: o.status,
    subtotal: num(o.subtotal),
    servicesTotal: num(o.servicesTotal),
    deliveryFee: num(o.deliveryFee),
    gstAmount: num(o.gstAmount),
    total: num(o.total),
    rejectReason: o.rejectReason,
    etaMinutes: o.etaMinutes,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: items.filter((i) => i.orderId === o.id).map((i) => ({ id: i.id, productId: i.productId, name: i.name, unitPrice: num(i.unitPrice), listPrice: num(i.listPrice), qty: i.qty, gstRate: i.gstRate, gstAmount: num(i.gstAmount), lineTotal: num(i.lineTotal), agreed: i.agreed })),
    services: services.filter((s) => s.orderId === o.id).map((s) => ({ id: s.id, title: s.title, unitPrice: num(s.unitPrice), qty: s.qty, gstRate: s.gstRate, gstAmount: num(s.gstAmount), lineTotal: num(s.lineTotal) })),
  }));
}

/** Customers see their bookings; vendors see bookings for their store. */
export const GET = route(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const conds = [];
  if (user.role === "vendor") {
    const [store] = await db.select({ id: stores.id }).from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    if (!store) fail(404, "Store not found");
    conds.push(eq(orders.storeId, store.id));
  } else {
    conds.push(eq(orders.customerId, user.id));
  }
  if (status) conds.push(eq(orders.status, status));
  const rows = await db
    .select()
    .from(orders)
    .where(and(...conds))
    .orderBy(desc(orders.createdAt))
    .limit(200);
  return ok({ orders: await withLines(rows) });
});

export const POST = route(async (req) => {
  const user = await requireUser("customer");
  const body = orderCreate.parse(await req.json());
  if (body.fulfillment === "delivery") {
    if (!body.address || body.address.length < 5) fail(400, "Enter your delivery address");
    if (!body.pincode || !isNcrPincode(body.pincode)) fail(400, "Delivery is available in Delhi, Noida and Gurugram pincodes only");
  }
  if (!body.items.length && !body.services.length) fail(400, "Your basket is empty");
  const [row] = await db.select().from(stores).where(eq(stores.id, body.storeId)).limit(1);
  if (!row) fail(404, "Store not found");
  const store = await refreshStore(row);
  if (!store.isOpen) fail(409, "This store is closed right now");

  const priced = await priceOrder(store, user.id, body);
  if (priced.issues.length) fail(409, priced.issues[0]);
  const order = await createOrderRecord(store, user, body, priced);
  const [full] = await withLines([order]);
  return ok({ order: full }, 201);
});
