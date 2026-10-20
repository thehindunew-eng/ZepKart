import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fail, ok, requireAdmin, route } from "@/lib/api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Deletes a customer account. Admin accounts can't be removed from here. */
export const DELETE = route<Ctx>(async (_req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  if (id === admin.id) fail(409, "You can't remove your own admin account");
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) fail(404, "User not found");
  if (u.role === "admin") fail(409, "Admin accounts can't be removed here");
  if (u.role === "vendor" || u.role === "wholesaler") fail(409, "Remove the store or wholesaler first");
  await db.delete(users).where(eq(users.id, id));
  return ok({ ok: true });
});
