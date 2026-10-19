import { ok, requireVendor, route } from "@/lib/api";
import { adQuote } from "@/lib/validators";
import { activeCampaignCount } from "@/lib/campaigns";
import { quoteAd } from "@/lib/pricing";
import { istParts } from "@/lib/time";

export const dynamic = "force-dynamic";


/** Live price for an ad: season × demand × length × plan discount, plus GST. */
export const POST = route(async (req) => {
  await requireVendor();
  const body = adQuote.parse(await req.json());
  const now = new Date();
  const quote = quoteAd({
    durationSec: Math.ceil(body.durationSec),
    planDays: body.planDays,
    activeCampaigns: await activeCampaignCount(now),
    month: istParts(now).m,
  });
  return ok({ quote });
});
