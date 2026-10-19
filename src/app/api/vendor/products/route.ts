import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ok, requireVendor, route } from "@/lib/api";
import { productCreate } from "@/lib/validators";
import { vendorProduct } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { store } = await requireVendor();
  const rows = await db.select().from(products).where(eq(products.storeId, store.id)).orderBy(desc(products.updatedAt));
  return ok({ products: rows.map(vendorProduct) });
});

export const POST = route(async (req) => {
  const { store } = await requireVendor();
  const body = productCreate.parse(await req.json());
  const [row] = await db
    .insert(products)
    .values({
      storeId: store.id,
      name: body.name,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      category: body.category,
      price: String(body.price),
      mrp: String(body.mrp),
      weightValue: String(body.weightValue),
      weightUnit: body.weightUnit,
      stockQty: body.stockQty,
      inStock: body.inStock,
      bargainEnabled: body.bargainEnabled,
      floorPrice: body.bargainEnabled && body.floorPrice ? String(body.floorPrice) : null,
      gstRate: body.gstRate,
    })
    .returning();
  return ok({ product: vendorProduct(row) }, 201);
});
