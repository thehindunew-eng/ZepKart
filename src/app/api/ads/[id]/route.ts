import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Only unpaid drafts can be deleted. Paid campaigns stay in history. */
export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { store } = await requireVendor();
  const { id } = await ctx.params;
  const [row] = await db
    .select()
    .from(adCampaigns)
    .where(and(eq(adCampaigns.id, id), eq(adCampaigns.storeId, store.id)))
    .limit(1);
  if (!row) fail(404, "Campaign not found");
  if (row.status !== "draft") fail(409, "Paid campaigns can't be deleted");
  await db.delete(adCampaigns).where(eq(adCampaigns.id, id));
  return ok({ ok: true });
});
