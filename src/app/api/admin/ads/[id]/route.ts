import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, featuredClips, stores, wholesalers } from "@/db/schema";
import { fail, ok, requireAdmin, route } from "@/lib/api";
import { adReview } from "@/lib/validators";
import { campaignDto } from "@/lib/campaigns";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Approve: the ad goes live for its plan and is added to Featured. Reject: it stays off with a reason. */
export const PATCH = route<Ctx>(async (req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = adReview.parse(await req.json());
  const [c] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, id)).limit(1);
  if (!c) fail(404, "Ad request not found");
  if (c.status !== "requested") fail(409, "Only paid requests waiting for review can be decided");

  const now = new Date();
  if (body.action === "reject") {
    const [row] = await db
      .update(adCampaigns)
      .set({ status: "rejected", rejectReason: body.reason || "Not approved", reviewedAt: now })
      .where(eq(adCampaigns.id, id))
      .returning();
    return ok({ campaign: campaignDto(row) });
  }

  const endsAt = new Date(now.getTime() + c.planDays * 86400000);
  const [row] = await db
    .update(adCampaigns)
    .set({ status: "active", startsAt: now, endsAt, reviewedAt: now, rejectReason: null })
    .where(eq(adCampaigns.id, id))
    .returning();
  let subtitle = "";
  if (c.storeId) {
    const [s] = await db.select({ shopName: stores.shopName }).from(stores).where(eq(stores.id, c.storeId)).limit(1);
    subtitle = s?.shopName ?? "";
  } else if (c.wholesalerId) {
    const [w] = await db.select({ businessName: wholesalers.businessName }).from(wholesalers).where(eq(wholesalers.id, c.wholesalerId)).limit(1);
    subtitle = w?.businessName ?? "";
  }
  await db.insert(featuredClips).values({
    title: c.title,
    subtitle: subtitle || null,
    videoUrl: c.videoUrl,
    durationSec: c.durationSec,
    storeId: c.storeId,
    campaignId: c.id,
    sortOrder: 0,
    isActive: true,
    endsAt,
  });
  return ok({ campaign: campaignDto(row) });
});
