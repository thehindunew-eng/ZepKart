import { desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, stores, wholesalers } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";
import { campaignDto } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

/** All ad requests from vendors and wholesalers (drafts are never sent to admin). */
export const GET = route(async () => {
  await requireAdmin();
  const rows = await db
    .select({ a: adCampaigns, store: stores, wh: wholesalers })
    .from(adCampaigns)
    .leftJoin(stores, eq(adCampaigns.storeId, stores.id))
    .leftJoin(wholesalers, eq(adCampaigns.wholesalerId, wholesalers.id))
    .where(ne(adCampaigns.status, "draft"))
    .orderBy(sql`case ${adCampaigns.status} when 'requested' then 0 when 'active' then 1 else 2 end`, desc(adCampaigns.createdAt))
    .limit(200);
  return ok({
    requests: rows.map((r) => ({
      ...campaignDto(r.a),
      requesterName: r.store?.shopName ?? r.wh?.businessName ?? "Unknown",
      requesterCity: r.store?.city ?? r.wh?.city ?? null,
      requesterType: r.store ? "vendor" : "wholesaler",
    })),
  });
});
