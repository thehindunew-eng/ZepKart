import { and, eq, inArray, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { extraServices, products, stores, threads, orders, orderItems, orderServices, messages } from "@/db/schema";
import { fail } from "@/lib/api";
import { gstInclusive, money } from "@/lib/pricing";
import { isAvailable, num } from "@/lib/dto";

export type OrderInput = {
  storeId: string;
  items: { productId: string; qty: number }[];
  services: { serviceId: string; qty: number }[];
  fulfillment: "pickup" | "delivery";
};

export type PricedLine = {
  productId: string;
  name: string;
  listPrice: number;
  unitPrice: number;
  qty: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
  agreed: boolean;
};

export type PricedService = {
  serviceId: string;
  title: string;
  unitPrice: number;
  qty: number;
  gstRate: number;
  gstAmount: number;
  lineTotal: number;
};

export type PricedOrder = {
  items: PricedLine[];
  services: PricedService[];
  subtotal: number;
  servicesTotal: number;
  deliveryFee: number;
  gstAmount: number;
  total: number;
  minOrder: number;
  issues: string[];
};

/**
 * Prices a basket for a customer. Applies any agreed bargain price the customer has
 * (single use, 24h), checks stock and store rules, and returns GST-inclusive totals.
 */
export async function priceOrder(store: typeof stores.$inferSelect, customerId: string, input: OrderInput): Promise<PricedOrder> {
  const issues: string[] = [];
  const now = new Date();
  const productIds = input.items.map((i) => i.productId);
  const serviceIds = input.services.map((s) => s.serviceId);

  const productRows = productIds.length
    ? await db.select().from(products).where(and(inArray(products.id, productIds), eq(products.storeId, store.id)))
    : [];
  const serviceRows = serviceIds.length
    ? await db.select().from(extraServices).where(and(inArray(extraServices.id, serviceIds), eq(extraServices.storeId, store.id)))
    : [];
  const agreedRows = productIds.length
    ? await db
        .select()
        .from(threads)
        .where(
          and(
            eq(threads.customerId, customerId),
            inArray(threads.productId, productIds),
            sql`${threads.agreedPrice} is not null`,
            gt(threads.agreedUntil, now),
          ),
        )
    : [];
  const agreedByProduct = new Map(agreedRows.map((t) => [t.productId, num(t.agreedPrice)]));

  const items: PricedLine[] = [];
  for (const line of input.items) {
    const p = productRows.find((r) => r.id === line.productId);
    if (!p) {
      issues.push("An item in your basket is no longer sold here");
      continue;
    }
    if (!isAvailable(p) || p.stockQty < line.qty) {
      issues.push(`${p.name} is out of stock${p.stockQty > 0 ? ` (only ${p.stockQty} left)` : ""}`);
    }
    const listPrice = num(p.price);
    const agreedPrice = agreedByProduct.get(p.id);
    const unitPrice = agreedPrice != null && agreedPrice < listPrice ? agreedPrice : listPrice;
    const lineTotal = money(unitPrice * line.qty);
    items.push({
      productId: p.id,
      name: p.name,
      listPrice,
      unitPrice,
      qty: line.qty,
      gstRate: p.gstRate,
      gstAmount: gstInclusive(lineTotal, p.gstRate),
      lineTotal,
      agreed: unitPrice !== listPrice,
    });
  }

  const svc: PricedService[] = [];
  for (const line of input.services) {
    const s = serviceRows.find((r) => r.id === line.serviceId);
    if (!s || !s.isActive) {
      issues.push("A selected extra service is no longer available");
      continue;
    }
    const unitPrice = num(s.price);
    const lineTotal = money(unitPrice * line.qty);
    svc.push({
      serviceId: s.id,
      title: s.title,
      unitPrice,
      qty: line.qty,
      gstRate: s.gstRate,
      gstAmount: gstInclusive(lineTotal, s.gstRate),
      lineTotal,
    });
  }

  if (input.fulfillment === "pickup" && !store.pickupAvailable) issues.push("This store does not offer pickup");
  if (input.fulfillment === "delivery" && !store.deliveryAvailable) issues.push("This store does not offer delivery");

  const subtotal = money(items.reduce((a, l) => a + l.lineTotal, 0));
  const servicesTotal = money(svc.reduce((a, l) => a + l.lineTotal, 0));
  const goods = subtotal + servicesTotal;
  const minOrder = num(store.minOrder);
  if (items.length && goods < minOrder) issues.push(`Minimum order is ₹${minOrder}`);
  const fee = input.fulfillment === "delivery" && items.length && goods < num(store.freeDeliveryAbove) ? num(store.deliveryFee) : 0;
  const deliveryFee = money(fee);
  const gstAmount = money(
    items.reduce((a, l) => a + l.gstAmount, 0) + svc.reduce((a, l) => a + l.gstAmount, 0) + gstInclusive(deliveryFee, 18),
  );
  return {
    items,
    services: svc,
    subtotal,
    servicesTotal,
    deliveryFee,
    gstAmount,
    total: money(goods + deliveryFee),
    minOrder,
    issues,
  };
}

export { NEXT_STATUS, STATUS_LABEL } from "@/lib/order-status";

/** Puts reserved stock back (used on rejection or cancellation). */
export async function restoreStock(tx: typeof db, orderId: string) {
  const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const l of lines) {
    if (!l.productId) continue;
    await tx
      .update(products)
      .set({ stockQty: sql`${products.stockQty} + ${l.qty}`, updatedAt: new Date() })
      .where(eq(products.id, l.productId));
  }
}

export async function createOrderRecord(
  store: typeof stores.$inferSelect,
  customer: { id: string; name: string },
  input: OrderInput & { customerName: string; phone: string; address?: string; pincode?: string; note?: string },
  priced: PricedOrder,
) {
  return db.transaction(async (tx) => {
    // Reserve stock atomically; fails if another order took the last units.
    for (const line of priced.items) {
      const r = await tx
        .update(products)
        .set({ stockQty: sql`${products.stockQty} - ${line.qty}`, updatedAt: new Date() })
        .where(and(eq(products.id, line.productId), sql`${products.stockQty} >= ${line.qty}`))
        .returning({ id: products.id });
      if (!r.length) fail(409, `${line.name} just sold out. Please update your basket.`);
    }
    const [order] = await tx
      .insert(orders)
      .values({
        storeId: store.id,
        customerId: customer.id,
        customerName: input.customerName,
        phone: input.phone,
        fulfillment: input.fulfillment,
        address: input.fulfillment === "delivery" ? input.address ?? null : null,
        pincode: input.fulfillment === "delivery" ? input.pincode ?? null : null,
        note: input.note || null,
        status: "new",
        subtotal: String(priced.subtotal),
        servicesTotal: String(priced.servicesTotal),
        deliveryFee: String(priced.deliveryFee),
        gstAmount: String(priced.gstAmount),
        total: String(priced.total),
        etaMinutes: store.etaMinutes,
      })
      .returning();
    if (priced.items.length) {
      await tx.insert(orderItems).values(
        priced.items.map((l) => ({
          orderId: order.id,
          productId: l.productId,
          name: l.name,
          unitPrice: String(l.unitPrice),
          listPrice: String(l.listPrice),
          qty: l.qty,
          gstRate: l.gstRate,
          gstAmount: String(l.gstAmount),
          lineTotal: String(l.lineTotal),
          agreed: l.agreed,
        })),
      );
    }
    if (priced.services.length) {
      await tx.insert(orderServices).values(
        priced.services.map((s) => ({
          orderId: order.id,
          serviceId: s.serviceId,
          title: s.title,
          unitPrice: String(s.unitPrice),
          qty: s.qty,
          gstRate: s.gstRate,
          gstAmount: String(s.gstAmount),
          lineTotal: String(s.lineTotal),
        })),
      );
    }
    // Agreed bargain prices are single-use: clear them and leave a note in the chat.
    const used = priced.items.filter((l) => l.agreed).map((l) => l.productId);
    if (used.length) {
      const usedThreads = await tx
        .update(threads)
        .set({ agreedPrice: null, agreedUntil: null, status: "open" })
        .where(and(eq(threads.customerId, customer.id), inArray(threads.productId, used)))
        .returning({ id: threads.id });
      for (const t of usedThreads) {
        await tx.insert(messages).values({ threadId: t.id, kind: "system", content: `Booked at the agreed price (order #${order.id.slice(0, 8).toUpperCase()}).` });
      }
    }
    return order;
  });
}
