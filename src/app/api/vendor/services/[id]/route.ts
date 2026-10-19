import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { extraServices } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";
import { servicePatch } from "@/lib/validators";
import { publicService } from "@/lib/dto";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, ctx) => {
  const { store } = await requireVendor();
  const { id } = await ctx.params;
  const body = servicePatch.parse(await req.json());
  const values: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    if (k === "price") values[k] = String(v);
    else if (k === "imageUrl" || k === "description") values[k] = v || null;
    else values[k] = v;
  }
  const [row] = await db
    .update(extraServices)
    .set(values)
    .where(and(eq(extraServices.id, id), eq(extraServices.storeId, store.id)))
    .returning();
  if (!row) fail(404, "Service not found");
  return ok({ service: publicService(row) });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { store } = await requireVendor();
  const { id } = await ctx.params;
  const rows = await db
    .delete(extraServices)
    .where(and(eq(extraServices.id, id), eq(extraServices.storeId, store.id)))
    .returning({ id: extraServices.id });
  if (!rows.length) fail(404, "Service not found");
  return ok({ ok: true });
});
