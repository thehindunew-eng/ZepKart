import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, wholesalerProducts, wholesalers } from "@/db/schema";
import { fail, ok, requireAdmin, route } from "@/lib/api";
import { adminWholesalerPatch } from "@/lib/validators";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = adminWholesalerPatch.parse(await req.json());
  const [row] = await db
    .update(wholesalers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(wholesalers.id, id))
    .returning();
  if (!row) fail(404, "Wholesaler not found");
  return ok({ wholesaler: { id: row.id, businessName: row.businessName, isVerified: row.isVerified } });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const [w] = await db.select().from(wholesalers).where(eq(wholesalers.id, id)).limit(1);
  if (!w) fail(404, "Wholesaler not found");
  await db.delete(wholesalerProducts).where(eq(wholesalerProducts.wholesalerId, id));
  await db.delete(wholesalers).where(eq(wholesalers.id, id));
  await db.delete(users).where(eq(users.id, w.userId));
  return ok({ ok: true });
});
