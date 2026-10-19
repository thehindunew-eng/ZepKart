import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, products, stores, threads } from "@/db/schema";
import { fail } from "@/lib/api";
import { num } from "@/lib/dto";

export type Viewer = { id: string; role: string };

/** Loads a thread and checks the viewer is the customer or the store owner. */
export async function threadAccess(threadId: string, viewer: Viewer) {
  const [t] = await db.select().from(threads).where(eq(threads.id, threadId)).limit(1);
  if (!t) fail(404, "Chat not found");
  const [store] = await db.select().from(stores).where(eq(stores.id, t.storeId)).limit(1);
  const isVendor = viewer.role === "vendor" && store?.ownerId === viewer.id;
  const isCustomer = viewer.role === "customer" && t.customerId === viewer.id;
  if (!isVendor && !isCustomer) fail(403, "Not allowed");
  const [product] = await db.select().from(products).where(eq(products.id, t.productId)).limit(1);
  return { thread: t, store, product, side: (isVendor ? "vendor" : "customer") as "vendor" | "customer" };
}

export const AGREED_WINDOW_MS = 24 * 60 * 60 * 1000;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Inserts a message and bumps the other side's unread counter. */
export async function addMessage(
  tx: Tx | typeof db,
  threadId: string,
  side: "vendor" | "customer",
  values: { senderId: string | null; kind: string; content?: string | null; price?: number | null; mode?: string | null; state?: string },
) {
  const [m] = await tx
    .insert(messages)
    .values({
      threadId,
      senderId: values.senderId,
      kind: values.kind,
      content: values.content ?? null,
      price: values.price == null ? null : String(values.price),
      mode: values.mode ?? null,
      state: values.state ?? "none",
    })
    .returning();
  await tx
    .update(threads)
    .set({
      lastMessageAt: new Date(),
      customerUnread: side === "vendor" ? sql`${threads.customerUnread} + 1` : threads.customerUnread,
      vendorUnread: side === "customer" ? sql`${threads.vendorUnread} + 1` : threads.vendorUnread,
    })
    .where(eq(threads.id, threadId));
  return m;
}

export function publicMessage(m: typeof messages.$inferSelect, viewerId: string) {
  return {
    id: m.id,
    kind: m.kind,
    content: m.content,
    price: m.price == null ? null : num(m.price),
    mode: m.mode,
    state: m.state,
    fromMe: m.senderId === viewerId,
    system: m.kind === "system",
    createdAt: m.createdAt,
  };
}

export const clearRead = (side: "vendor" | "customer", threadId: string) =>
  db
    .update(threads)
    .set(side === "vendor" ? { vendorUnread: 0 } : { customerUnread: 0 })
    .where(and(eq(threads.id, threadId)));
