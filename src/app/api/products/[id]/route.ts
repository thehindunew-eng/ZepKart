import { and, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { extraServices, products, stores, threads } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { fail, ok, route } from "@/lib/api";
import { publicProduct, publicService, publicStore } from "@/lib/dto";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows[0]) fail(404, "Item not found");
  const rawStore = (await db.select().from(stores).where(eq(stores.id, rows[0].storeId)).limit(1))[0];
  const store = await refreshStore(rawStore);
  const services = await db
    .select()
    .from(extraServices)
    .where(and(eq(extraServices.storeId, store.id), eq(extraServices.isActive, true)))
    .orderBy(asc(extraServices.title));
  const user = await currentUser();
  let threadId: string | null = null;
  if (user && user.role === "customer") {
    const t = await db
      .select({ id: threads.id })
      .from(threads)
      .where(and(eq(threads.productId, id), eq(threads.customerId, user.id)))
      .limit(1);
    threadId = t[0]?.id ?? null;
  }
  return ok({
    product: publicProduct(rows[0], store),
    store: publicStore(store),
    services: services.map(publicService),
    threadId,
  });
});
