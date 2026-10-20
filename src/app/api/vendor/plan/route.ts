import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, stores } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";
import { isPremium, num } from "@/lib/dto";
import { PREMIUM_PLAN, premiumQuote } from "@/lib/pricing";
import { maskedPayment, newPaymentReference } from "@/lib/checkout";
import { adPay } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** Plan status, price, and purchase history for the logged-in vendor. */
export const GET = route(async () => {
  const { store } = await requireVendor();
  const history = await db
    .select()
    .from(payments)
    .where(and(eq(payments.storeId, store.id), eq(payments.purpose, "plan")))
    .orderBy(desc(payments.createdAt))
    .limit(20);
  return ok({
    plan: isPremium(store) ? "premium" : "basic",
    planExpiresAt: store.planExpiresAt,
    quote: premiumQuote(),
    features: {
      basic: ["Connect with customers", "Live inventory and bookings", "Ads and extra services"],
      premium: ["See and choose every wholesaler", "Send restock requests", "Compare quotes by price and grade"],
    },
    payments: history.map((p) => ({ reference: p.reference, amount: num(p.amount), method: p.method, masked: p.maskedDetails, createdAt: p.createdAt })),
    days: PREMIUM_PLAN.days,
  });
});

/** Mock checkout for Premium. Card data is validated and only the masked label is kept. */
export const POST = route(async (req) => {
  const { user, store } = await requireVendor();
  const body = adPay.parse(await req.json());
  const masked = maskedPayment(body);
  const quote = premiumQuote();
  const now = new Date();
  // Extend from the current expiry when the plan is still active.
  const base = store.planExpiresAt && store.planExpiresAt.getTime() > now.getTime() ? store.planExpiresAt : now;
  const expiresAt = new Date(base.getTime() + PREMIUM_PLAN.days * 86400000);
  const reference = newPaymentReference();

  const updated = await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      userId: user.id,
      storeId: store.id,
      purpose: "plan",
      amount: String(quote.total),
      method: body.method,
      reference,
      maskedDetails: masked,
      status: "succeeded",
    });
    const [row] = await tx.update(stores).set({ plan: "premium", planExpiresAt: expiresAt, updatedAt: now }).where(eq(stores.id, store.id)).returning();
    return row;
  });
  if (!updated) fail(404, "Store not found");
  return ok({ plan: "premium", planExpiresAt: expiresAt, payment: { reference, masked, amount: quote.total } }, 201);
});
