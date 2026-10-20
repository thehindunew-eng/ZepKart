import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wholesalerProducts } from "@/db/schema";
import { ok, requireWholesaler, route } from "@/lib/api";
import { wholesalerProductDto } from "@/lib/dto";
import { wholesalerProductInput } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { wholesaler } = await requireWholesaler();
  const rows = await db.select().from(wholesalerProducts).where(eq(wholesalerProducts.wholesalerId, wholesaler.id)).orderBy(asc(wholesalerProducts.name));
  return ok({ products: rows.map(wholesalerProductDto) });
});

export const POST = route(async (req) => {
  const { wholesaler } = await requireWholesaler();
  const body = wholesalerProductInput.parse(await req.json());
  const [row] = await db
    .insert(wholesalerProducts)
    .values({
      wholesalerId: wholesaler.id,
      name: body.name,
      category: body.category,
      imageUrl: body.imageUrl || null,
      weightValue: String(body.weightValue),
      weightUnit: body.weightUnit,
      price: String(body.price),
      moq: body.moq,
      stockQty: body.stockQty,
      grade: body.grade,
      inStock: body.inStock,
    })
    .returning();
  return ok({ product: wholesalerProductDto(row) }, 201);
});
