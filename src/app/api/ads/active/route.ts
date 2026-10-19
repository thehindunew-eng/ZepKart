import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, stores } from "@/db/schema";
import { ok, route } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Live campaigns for the customer home carousel. */
export const GET = route(async () => {
  const rows = await db
    .select({ a: adCampaigns, s: stores })
    .from(adCampaigns)
    .innerJoin(stores, eq(adCampaigns.storeId, stores.id))
    .where(and(eq(adCampaigns.status, "active"), gt(adCampaigns.endsAt, new Date())))
    .orderBy(desc(adCampaigns.startsAt))
    .limit(10);
  return ok({
    ads: rows.map((r) => ({
      id: r.a.id,
      title: r.a.title,
      description: r.a.description,
      videoUrl: r.a.videoUrl,
      durationSec: r.a.durationSec,
      storeId: r.s.id,
      storeName: r.s.shopName,
      storeLocality: r.s.locality,
      city: r.s.city,
    })),
  });
});
