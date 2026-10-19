import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { adCampaigns, payments } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";
import { adPay } from "@/lib/validators";
import { num } from "@/lib/dto";
import { campaignDto } from "@/lib/campaigns";
import { maskedPayment } from "@/lib/checkout";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Mock checkout: validates the details and records a successful payment.
 * Card numbers and CVV are never stored, only the brand and last four digits.
 */
export const POST = route<Ctx>(async (req, ctx) => {
  const { user, store } = await requireVendor();
  const { id } = await ctx.params;
  const body = adPay.parse(await req.json());
  const [c] = await db
    .select()
    .from(adCampaigns)
    .where(and(eq(adCampaigns.id, id), eq(adCampaigns.storeId, store.id)))
    .limit(1);
  if (!c) fail(404, "Campaign not found");
  if (c.status !== "draft") fail(409, "This campaign is already paid");

  const masked = maskedPayment(body);

  const now = new Date();
  const endsAt = new Date(now.getTime() + c.planDays * 86400000);
  const reference = `ZK${now.getTime().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
  const updated = await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      userId: user.id,
      storeId: store.id,
      campaignId: c.id,
      purpose: "ad",
      amount: String(num(c.total)),
      method: body.method,
      reference,
      maskedDetails: masked,
      status: "succeeded",
    });
    const [row] = await tx
      .update(adCampaigns)
      .set({ status: "active", startsAt: now, endsAt })
      .where(eq(adCampaigns.id, c.id))
      .returning();
    return row;
  });
  return ok({ campaign: campaignDto(updated), payment: { reference, masked, amount: num(c.total) } });
});
