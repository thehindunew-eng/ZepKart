import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns } from "@/db/schema";
import { num } from "@/lib/dto";

export async function activeCampaignCount(now = new Date()) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(adCampaigns)
    .where(and(eq(adCampaigns.status, "active"), gt(adCampaigns.endsAt, now)));
  return r?.n ?? 0;
}

export function campaignDto(a: typeof adCampaigns.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    videoUrl: a.videoUrl,
    durationSec: a.durationSec,
    planDays: a.planDays,
    status: a.status,
    rejectReason: a.rejectReason,
    reviewedAt: a.reviewedAt,
    requester: a.storeId ? "vendor" : "wholesaler",
    seasonName: a.seasonName,
    seasonMultiplier: num(a.seasonMultiplier),
    demandMultiplier: num(a.demandMultiplier),
    lengthFactor: num(a.lengthFactor),
    planDiscountPct: num(a.planDiscountPct),
    baseAmount: num(a.baseAmount),
    discountAmount: num(a.discountAmount),
    taxableAmount: num(a.taxableAmount),
    gstAmount: num(a.gstAmount),
    total: num(a.total),
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    createdAt: a.createdAt,
  };
}
