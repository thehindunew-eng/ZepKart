import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, stores, users } from "@/db/schema";
import { fail, ok, requireAdmin, route } from "@/lib/api";
import { adminStorePatch } from "@/lib/validators";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Admin edits any store's plan, open state and delivery terms. */
export const PATCH = route<Ctx>(async (req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = adminStorePatch.parse(await req.json());
  const [current] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  if (!current) fail(404, "Store not found");
  const patch: Record<string, unknown> = { ...body, updatedAt: new Date() };
  for (const k of ["deliveryFee", "freeDeliveryAbove", "minOrder"] as const) if (body[k] != null) patch[k] = String(body[k]);
  if (body.plan === "premium") patch.planExpiresAt = new Date(Date.now() + 30 * 86400000);
  if (body.plan === "basic") patch.planExpiresAt = null;
  const [row] = await db.update(stores).set(patch).where(eq(stores.id, id)).returning();
  return ok({ store: { id: row.id, plan: row.plan, isOpen: row.isOpen, shopName: row.shopName } });
});

/** Removes a store, its products and its bookings. Requires confirmation in the UI. */
export const DELETE = route<Ctx>(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const [s] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  if (!s) fail(404, "Store not found");
  await db.delete(products).where(eq(products.storeId, id));
  await db.delete(stores).where(eq(stores.id, id));
  await db.delete(users).where(eq(users.id, s.ownerId));
  return ok({ ok: true });
});
