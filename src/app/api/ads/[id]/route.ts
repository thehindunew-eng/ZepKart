import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns } from "@/db/schema";
import { fail, ok, requireAdRequester, route } from "@/lib/api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Only the requester's own unpaid drafts can be deleted. Paid requests stay in history. */
export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { storeId, wholesalerId } = await requireAdRequester();
  const { id } = await ctx.params;
  const owner = storeId ? eq(adCampaigns.storeId, storeId) : eq(adCampaigns.wholesalerId, wholesalerId!);
  const [row] = await db
    .select()
    .from(adCampaigns)
    .where(and(eq(adCampaigns.id, id), owner))
    .limit(1);
  if (!row) fail(404, "Ad request not found");
  if (row.status !== "draft") fail(409, "Paid ad requests can't be deleted");
  await db.delete(adCampaigns).where(eq(adCampaigns.id, id));
  return ok({ ok: true });
});

