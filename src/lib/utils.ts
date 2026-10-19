import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
export const money = (n: number | string | null | undefined) => inr.format(Number(n ?? 0));

export const percentOff = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const CATEGORY_EMOJI: Record<string, string> = {
  "Fruits & Vegetables": "🥦",
  "Dairy & Bakery": "🥛",
  Staples: "🌾",
  Grocery: "🛒",
  Beverages: "☕",
  Snacks: "🍪",
  "Personal Care": "🧴",
  Household: "🧽",
  "Meat & Eggs": "🥚",
};

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const clampNum = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
