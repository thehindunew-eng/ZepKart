import { fail } from "@/lib/api";
import type { adPay } from "@/lib/validators";
import { z } from "zod";

type PayInput = z.infer<typeof adPay>;

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
 * Mock checkout validation shared by ads and plan purchases.
 * Returns only a masked label. Card numbers and CVV are never stored.
 */
export function maskedPayment(body: PayInput): string {
  if (body.method === "upi") {
    const [user, bank] = body.upiId.split("@");
    return `UPI · ${user.slice(0, 2)}***@${bank}`;
  }
  if (!luhn(body.cardNumber)) fail(400, "Card number looks invalid");
  const [mm, yy] = body.expiry.split("/").map(Number);
  const expEnd = new Date(Date.UTC(2000 + yy, mm, 1));
  if (expEnd <= new Date()) fail(400, "This card has expired");
  return `${cardBrand(body.cardNumber)} · •••• ${body.cardNumber.slice(-4)}`;
}

export function newPaymentReference() {
  const now = Date.now();
  const rnd = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `ZK${now.toString(36).toUpperCase()}${rnd}`;
}
