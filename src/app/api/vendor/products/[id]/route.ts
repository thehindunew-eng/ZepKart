import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";
import { productPatch } from "@/lib/validators";
import { vendorProduct } from "@/lib/dto";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

async function ownProduct(storeId: string, id: string) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.storeId, storeId)))
    .limit(1);
  if (!rows[0]) fail(404, "Item not found");
  return rows[0];
}

export const PATCH = route<Ctx>(async (req, ctx) => {
  const { store } = await requireVendor();
  const { id } = await ctx.params;
  const current = await ownProduct(store.id, id);
  const body = productPatch.parse(await req.json());

  const price = body.price ?? Number(current.price);
  const mrp = body.mrp ?? Number(current.mrp);
  const bargain = body.bargainEnabled ?? current.bargainEnabled;
  const floor = body.floorPrice !== undefined ? body.floorPrice : current.floorPrice == null ? null : Number(current.floorPrice);
  if (mrp < price) fail(400, "MRP must be at least the selling price");
  if (bargain && (floor == null || floor <= 0 || floor > price)) fail(400, "Auto-accept floor must be between 1 and the selling price");

  const values: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    if (k === "price" || k === "mrp" || k === "weightValue") values[k] = String(v);
    else if (k === "floorPrice") values[k] = v == null ? null : String(v);
    else if (k === "imageUrl" || k === "description") values[k] = v || null;
    else values[k] = v;
  }
  const [row] = await db
    .update(products)
    .set(values)
    .where(and(eq(products.id, id), eq(products.storeId, store.id)))
    .returning();
  return ok({ product: vendorProduct(row) });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { store } = await requireVendor();
  const { id } = await ctx.params;
  await ownProduct(store.id, id);
  await db.delete(products).where(and(eq(products.id, id), eq(products.storeId, store.id)));
  return ok({ ok: true });
});
