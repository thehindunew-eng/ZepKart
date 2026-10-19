import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { adCampaigns, payments } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";
import { adPay } from "@/lib/validators";
import { num } from "@/lib/dto";
import { campaignDto } from "@/lib/campaigns";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Luhn checksum for card numbers. */
function luhn(num: string) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function cardBrand(n: string) {
  if (n.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^(60|65|8[1-9])/.test(n) || /^352/.test(n)) return "RuPay";
  if (/^3[47]/.test(n)) return "Amex";
  return "Card";
}

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

  let masked: string;
  if (body.method === "upi") {
    const [user, bank] = body.upiId.split("@");
    masked = `UPI · ${user.slice(0, 2)}***@${bank}`;
  } else {
    if (!luhn(body.cardNumber)) fail(400, "Card number looks invalid");
    const [mm, yy] = body.expiry.split("/").map(Number);
    const expEnd = new Date(Date.UTC(2000 + yy, mm, 1));
    if (expEnd <= new Date()) fail(400, "This card has expired");
    masked = `${cardBrand(body.cardNumber)} · •••• ${body.cardNumber.slice(-4)}`;
  }

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
