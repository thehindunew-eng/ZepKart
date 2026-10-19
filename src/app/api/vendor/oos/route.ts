import { and, asc, eq, or, lte } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ok, requireVendor, route } from "@/lib/api";
import { vendorProduct } from "@/lib/dto";

export const dynamic = "force-dynamic";

/** Out-of-stock items for the logged-in vendor's store. */
export const GET = route(async () => {
  const { store } = await requireVendor();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, store.id), or(eq(products.inStock, false), lte(products.stockQty, 0))))
    .orderBy(asc(products.name));
  return ok({ products: rows.map((p) => ({ ...vendorProduct(p), costPrice: p.costPrice == null ? null : Number(p.costPrice) })) });
});
