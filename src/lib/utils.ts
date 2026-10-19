export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function inr(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  if (Number.isNaN(v)) return "₹0";
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function timeAgo(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const AD_RATE_CARD = [
  { season: "Normal", perDay: 99, label: "Normal days", hint: "Base visibility on home strip" },
  { season: "Weekend", perDay: 199, label: "Weekend Rush", hint: "Fri–Sun, 2.1x impressions" },
  { season: "Festive", perDay: 349, label: "Festive Season", hint: "Diwali / Eid / Christmas demand" },
  { season: "Peak", perDay: 499, label: "Peak Demand", hint: "Top slot + push to nearby users" },
] as const;

export function adPrice(season: string, days: number) {
  const row = AD_RATE_CARD.find((r) => r.season === season) ?? AD_RATE_CARD[0];
  return row.perDay * days;
}

export function waLink(phone: string | null | undefined, text: string) {
  const p = (phone || "").replace(/\D/g, "");
  const num = p.length === 10 ? `91${p}` : p || "919999999999";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export const CATEGORIES = [
  "All",
  "Staples",
  "Dairy",
  "Fruits",
  "Vegetables",
  "Bakery",
  "Snacks",
  "Beverages",
  "Personal Care",
];
