import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { adCampaigns, payments } from "@/db/schema";
import { fail, ok, requireAdRequester, route } from "@/lib/api";
import { adPay } from "@/lib/validators";
import { num } from "@/lib/dto";
import { campaignDto } from "@/lib/campaigns";
import { maskedPayment } from "@/lib/checkout";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Mock checkout. Paying submits the ad request to the admin queue. The ad goes live only after
 * an admin approves it. Card numbers and CVV are never stored, only the brand and last four digits.
 */
export const POST = route<Ctx>(async (req, ctx) => {
  const { user, storeId, wholesalerId } = await requireAdRequester();
  const { id } = await ctx.params;
  const body = adPay.parse(await req.json());
  const owner = storeId ? eq(adCampaigns.storeId, storeId) : eq(adCampaigns.wholesalerId, wholesalerId!);
  const [c] = await db
    .select()
    .from(adCampaigns)
    .where(and(eq(adCampaigns.id, id), owner))
    .limit(1);
  if (!c) fail(404, "Ad request not found");
  if (c.status !== "draft") fail(409, "This ad request is already paid");

  const masked = maskedPayment(body);
  const now = new Date();
  const reference = `ZK${now.getTime().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
  const updated = await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      userId: user.id,
      storeId,
      wholesalerId,
      campaignId: c.id,
      purpose: "ad",
      amount: String(num(c.total)),
      method: body.method,
      reference,
      maskedDetails: masked,
      status: "succeeded",
    });
    const [row] = await tx.update(adCampaigns).set({ status: "requested" }).where(eq(adCampaigns.id, c.id)).returning();
    return row;
  });
  return ok({ campaign: campaignDto(updated), payment: { reference, masked, amount: num(c.total) } });
});
