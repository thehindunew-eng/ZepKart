import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, extraServices, products, stores } from "@/db/schema";
import { fail, ok, route } from "@/lib/api";
import { publicProduct, publicService, publicStore } from "@/lib/dto";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const rows = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  if (!rows[0]) fail(404, "Store not found");
  const store = await refreshStore(rows[0]);
  const [items, services, ads] = await Promise.all([
    db.select().from(products).where(eq(products.storeId, store.id)).orderBy(asc(products.category), asc(products.name)),
    db.select().from(extraServices).where(and(eq(extraServices.storeId, store.id), eq(extraServices.isActive, true))).orderBy(asc(extraServices.title)),
    db
      .select()
      .from(adCampaigns)
      .where(and(eq(adCampaigns.storeId, store.id), eq(adCampaigns.status, "active"), gt(adCampaigns.endsAt, new Date())))
      .limit(3),
  ]);
  return ok({
    store: publicStore(store),
    products: items.map((p) => publicProduct(p, store)),
    services: services.map(publicService),
    ads: ads.map((a) => ({ id: a.id, title: a.title, videoUrl: a.videoUrl, durationSec: a.durationSec })),
  });
});
