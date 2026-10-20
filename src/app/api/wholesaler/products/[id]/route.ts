import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { wholesalerProducts } from "@/db/schema";
import { fail, ok, requireWholesaler, route } from "@/lib/api";
import { wholesalerProductDto } from "@/lib/dto";
import { wholesalerProductPatch } from "@/lib/validators";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, ctx) => {
  const { wholesaler } = await requireWholesaler();
  const { id } = await ctx.params;
  const body = wholesalerProductPatch.parse(await req.json());
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) values.name = body.name;
  if (body.category !== undefined) values.category = body.category;
  if (body.imageUrl !== undefined) values.imageUrl = body.imageUrl || null;
  if (body.weightValue !== undefined) values.weightValue = String(body.weightValue);
  if (body.weightUnit !== undefined) values.weightUnit = body.weightUnit;
  if (body.price !== undefined) values.price = String(body.price);
  if (body.moq !== undefined) values.moq = body.moq;
  if (body.stockQty !== undefined) values.stockQty = body.stockQty;
  if (body.grade !== undefined) values.grade = body.grade;
  if (body.inStock !== undefined) values.inStock = body.inStock;
  const [row] = await db
    .update(wholesalerProducts)
    .set(values)
    .where(and(eq(wholesalerProducts.id, id), eq(wholesalerProducts.wholesalerId, wholesaler.id)))
    .returning();
  if (!row) fail(404, "Product not found");
  return ok({ product: wholesalerProductDto(row) });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { wholesaler } = await requireWholesaler();
  const { id } = await ctx.params;
  const [row] = await db
    .delete(wholesalerProducts)
    .where(and(eq(wholesalerProducts.id, id), eq(wholesalerProducts.wholesalerId, wholesaler.id)))
    .returning({ id: wholesalerProducts.id });
  if (!row) fail(404, "Product not found");
  return ok({ deleted: true });
});
