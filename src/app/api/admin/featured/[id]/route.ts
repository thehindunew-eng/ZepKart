import { eq } from "drizzle-orm";
import { db } from "@/db";
import { featuredClips } from "@/db/schema";
import { fail, ok, requireAdmin, route } from "@/lib/api";
import { featuredPatch } from "@/lib/validators";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = featuredPatch.parse(await req.json());
  const { storeId, ...rest } = body;
  const [row] = await db
    .update(featuredClips)
    .set({ ...rest, ...(storeId !== undefined ? { storeId } : {}) })
    .where(eq(featuredClips.id, id))
    .returning();
  if (!row) fail(404, "Clip not found");
  return ok({ clip: row });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await db.delete(featuredClips).where(eq(featuredClips.id, id));
  return ok({ ok: true });
});
