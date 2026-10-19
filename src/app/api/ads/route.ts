import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";
import { adCreate } from "@/lib/validators";
import { storedMediaInfo } from "@/lib/media";
import { quoteAd, MAX_AD_SECONDS } from "@/lib/pricing";
import { istParts } from "@/lib/time";
import { activeCampaignCount, campaignDto } from "@/lib/campaigns";

export const dynamic = "force-dynamic";


export const GET = route(async () => {
  const { store } = await requireVendor();
  const rows = await db.select().from(adCampaigns).where(eq(adCampaigns.storeId, store.id)).orderBy(desc(adCampaigns.createdAt));
  return ok({ campaigns: rows.map(campaignDto) });
});

/** Creates a draft campaign with a locked price. Duration is re-checked from the file. */
export const POST = route(async (req) => {
  const { store } = await requireVendor();
  const body = adCreate.parse(await req.json());
  const media = await storedMediaInfo(body.videoUrl);
  if (!media) fail(400, "Upload your video again");
  if (media.durationSec == null) fail(400, "We couldn't read this video's length. Try re-exporting as MP4.");
  if (media.durationSec > MAX_AD_SECONDS) fail(400, `Video is ${Math.ceil(media.durationSec)} seconds. Advertisements must be ${MAX_AD_SECONDS} seconds or less.`);
  const durationSec = Math.max(1, Math.ceil(media.durationSec));

  const now = new Date();
  const q = quoteAd({ durationSec, planDays: body.planDays, activeCampaigns: await activeCampaignCount(now), month: istParts(now).m });
  const [row] = await db
    .insert(adCampaigns)
    .values({
      storeId: store.id,
      title: body.title,
      description: body.description || null,
      videoUrl: body.videoUrl,
      durationSec,
      planDays: q.planDays,
      seasonName: q.seasonName,
      seasonMultiplier: String(q.seasonMultiplier),
      demandMultiplier: String(q.demandMultiplier),
      lengthFactor: String(q.lengthFactor),
      planDiscountPct: String(q.planDiscountPct),
      baseAmount: String(q.base),
      discountAmount: String(q.discount),
      taxableAmount: String(q.taxable),
      gstAmount: String(q.gst),
      total: String(q.total),
      status: "draft",
    })
    .returning();
  return ok({ campaign: campaignDto(row) }, 201);
});
