/**
 * Pricing rules.
 *
 * Ads: base rate × days × video-length factor × monthly festive (season) multiplier
 *      × live demand multiplier, minus plan discount, plus 18% GST.
 * Orders: product and service prices are GST-inclusive; GST is shown as a breakdown.
 */

export const AD_BASE_PER_DAY = 299;
export const AD_GST_RATE = 18;
export const MAX_AD_SECONDS = 60;

export const AD_PLANS = [
  { days: 7, label: "Weekly", discountPct: 0 },
  { days: 15, label: "Fortnight", discountPct: 10 },
  { days: 30, label: "Monthly", discountPct: 20 },
] as const;

/** Monthly festive multipliers (index = month number). */
export const SEASONS: Record<number, { name: string; multiplier: number }> = {
  1: { name: "New Year & Republic Day", multiplier: 1.1 },
  2: { name: "Valentine's & wedding season", multiplier: 1.05 },
  3: { name: "Holi", multiplier: 1.15 },
  4: { name: "Summer launch", multiplier: 1.0 },
  5: { name: "Summer wedding season", multiplier: 1.1 },
  6: { name: "Monsoon", multiplier: 0.95 },
  7: { name: "Monsoon sale", multiplier: 1.0 },
  8: { name: "Raksha Bandhan & Independence Day", multiplier: 1.2 },
  9: { name: "Ganesh Chaturthi & Onam", multiplier: 1.2 },
  10: { name: "Navratri & Dussehra", multiplier: 1.35 },
  11: { name: "Diwali & wedding season", multiplier: 1.5 },
  12: { name: "Christmas & New Year", multiplier: 1.3 },
};

export function seasonForMonth(month: number) {
  return SEASONS[month] ?? SEASONS[1];
}

export function lengthFactor(durationSec: number) {
  if (durationSec <= 15) return 1.0;
  if (durationSec <= 30) return 1.6;
  if (durationSec <= 45) return 2.2;
  return 2.8;
}

/** Demand rises with the number of campaigns running right now (capped at +50%). */
export function demandMultiplier(activeCampaigns: number) {
  return Math.round((1 + Math.min(0.5, activeCampaigns * 0.02)) * 1000) / 1000;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export type AdQuote = {
  durationSec: number;
  planDays: number;
  planLabel: string;
  lengthFactor: number;
  seasonName: string;
  seasonMultiplier: number;
  demandMultiplier: number;
  activeCampaigns: number;
  base: number;
  seasonal: number;
  demand: number;
  planDiscountPct: number;
  discount: number;
  taxable: number;
  gstRate: number;
  gst: number;
  total: number;
};

export function quoteAd(input: { durationSec: number; planDays: number; activeCampaigns: number; month: number }): AdQuote {
  const plan = AD_PLANS.find((p) => p.days === input.planDays);
  if (!plan) throw new Error("Unsupported plan");
  if (input.durationSec < 1 || input.durationSec > MAX_AD_SECONDS) throw new Error("Video must be 60 seconds or less");
  const season = seasonForMonth(input.month);
  const lf = lengthFactor(input.durationSec);
  const dm = demandMultiplier(input.activeCampaigns);
  const base = r2(AD_BASE_PER_DAY * plan.days * lf);
  const seasonal = r2(base * season.multiplier);
  const demand = r2(seasonal * dm);
  const discount = r2((demand * plan.discountPct) / 100);
  const taxable = r2(demand - discount);
  const gst = r2((taxable * AD_GST_RATE) / 100);
  return {
    durationSec: input.durationSec,
    planDays: plan.days,
    planLabel: plan.label,
    lengthFactor: lf,
    seasonName: season.name,
    seasonMultiplier: season.multiplier,
    demandMultiplier: dm,
    activeCampaigns: input.activeCampaigns,
    base,
    seasonal,
    demand,
    planDiscountPct: plan.discountPct,
    discount,
    taxable,
    gstRate: AD_GST_RATE,
    gst,
    total: r2(taxable + gst),
  };
}

/** GST included in an inclusive amount: amount × rate / (100 + rate). */
export function gstInclusive(amount: number, rate: number) {
  return r2((amount * rate) / (100 + rate));
}

export const money = (n: number) => r2(n);

/** Vendor plans. Basic is free and connects you with customers. Premium unlocks wholesalers and restock. */
export const PREMIUM_PLAN = { days: 30, monthlyPrice: 999, gstRate: 18, label: "Premium" } as const;

export function premiumQuote() {
  const gst = r2((PREMIUM_PLAN.monthlyPrice * PREMIUM_PLAN.gstRate) / 100);
  return { days: PREMIUM_PLAN.days, base: PREMIUM_PLAN.monthlyPrice, gstRate: PREMIUM_PLAN.gstRate, gst, total: r2(PREMIUM_PLAN.monthlyPrice + gst) };
}
