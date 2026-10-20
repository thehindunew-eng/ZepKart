import { z } from "zod";
import { AD_PLANS } from "@/lib/pricing";
import { CATEGORIES, CITIES, GST_RATES, WEIGHT_UNITS, isNcrPincode } from "@/lib/ncr";

const str = (max: number) => z.string().trim().max(max);
const optStr = (max: number) => z.union([z.string().trim().max(max), z.null()]).optional();
const money = z.coerce.number().min(0).max(1_000_000).transform((n) => Math.round(n * 100) / 100);
const urlOrPath = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//.test(v) || /^\/api\/media\/[^/?#]+$/.test(v) || /^\/demo-ads\/[^/?#]+$/.test(v), "Use an https link or an uploaded file");
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number");

export const signupSchema = z.object({
  name: str(120).min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  phone: z.string().trim().max(20).optional().default(""),
  role: z.enum(["customer", "vendor", "wholesaler", "admin"]).default("customer"),
  // Required only for "Signup as admin". Checked against the admin access password on the server.
  adminCode: z.string().max(200).optional(),
  shopName: str(160).optional(), // shop name for vendors, business name for wholesalers
  gstin: z.string().trim().toUpperCase().optional(),
  city: z.enum(CITIES).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(200),
});

export const productInput = z.object({
  name: str(160).min(2, "Name is required"),
  description: optStr(1000),
  imageUrl: urlOrPath.optional().nullable(),
  category: z.enum(CATEGORIES),
  price: money.refine((n) => n > 0, "Price must be more than 0"),
  mrp: money,
  weightValue: z.coerce.number().min(0).max(100000),
  weightUnit: z.enum(WEIGHT_UNITS),
  stockQty: z.coerce.number().int().min(0).max(1_000_000),
  inStock: z.boolean(),
  bargainEnabled: z.boolean(),
  floorPrice: money.optional().nullable(),
  gstRate: z.coerce.number().refine((n) => (GST_RATES as readonly number[]).includes(n), "Invalid GST rate"),
});

export const productCreate = productInput
  .refine((p) => p.mrp >= p.price, { message: "MRP must be at least the selling price", path: ["mrp"] })
  .refine((p) => !p.bargainEnabled || (p.floorPrice != null && p.floorPrice > 0 && p.floorPrice <= p.price), {
    message: "Auto-accept floor must be between 1 and the selling price",
    path: ["floorPrice"],
  });

export const productPatch = productInput.partial();

export const serviceInput = z.object({
  title: str(160).min(2, "Title is required"),
  description: optStr(600),
  imageUrl: urlOrPath.optional().nullable(),
  price: money.refine((n) => n > 0, "Price must be more than 0"),
  unitLabel: str(60).min(1).default("per booking"),
  gstRate: z.coerce.number().refine((n) => (GST_RATES as readonly number[]).includes(n), "Invalid GST rate"),
  isActive: z.boolean().default(true),
});

export const servicePatch = serviceInput.partial();

export const storeSettings = z.object({
  shopName: str(160).min(2, "Shop name is required"),
  description: optStr(1000),
  dpUrl: urlOrPath.optional().nullable(),
  coverUrl: urlOrPath.optional().nullable(),
  whatsapp: phone,
  phone: phone.optional().nullable(),
  address: str(300).min(5, "Address is required"),
  locality: str(120).min(2, "Locality is required"),
  city: z.enum(CITIES),
  pincode: z.string().trim().refine(isNcrPincode, "Use an NCR pincode (Delhi 110xxx, Noida 201xxx, Gurugram 122xxx)"),
  category: z.enum(CATEGORIES).optional(),
  pickupAvailable: z.boolean(),
  deliveryAvailable: z.boolean(),
  deliveryFee: money,
  freeDeliveryAbove: money,
  minOrder: money,
  etaMinutes: z.coerce.number().int().min(10).max(240),
  openingHours: str(120).optional(),
});

export const storeSettingsPatch = storeSettings.partial();

export const statusPatch = z.object({
  isOpen: z.boolean().optional(),
  nextOpeningAt: z.union([z.iso.datetime({ offset: true }), z.null()]).optional(),
  nextClosingAt: z.union([z.iso.datetime({ offset: true }), z.null()]).optional(),
});

export const orderLines = z.object({
  storeId: z.uuid(),
  items: z.array(z.object({ productId: z.uuid(), qty: z.coerce.number().int().min(1).max(50) })).default([]),
  services: z.array(z.object({ serviceId: z.uuid(), qty: z.coerce.number().int().min(1).max(10) })).default([]),
  fulfillment: z.enum(["pickup", "delivery"]),
});

export const orderCreate = orderLines.extend({
  customerName: str(120).min(2, "Enter your name"),
  phone,
  address: str(300).optional(),
  pincode: z.string().trim().optional(),
  note: str(300).optional(),
});

export const orderAction = z.object({
  action: z.enum(["accept", "reject", "preparing", "ready", "out_for_delivery", "complete", "cancel"]),
  reason: str(200).optional(),
});

export const threadCreate = z.object({ productId: z.uuid() });

export const messageCreate = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), content: str(1000).min(1, "Write a message") }),
  z.object({ kind: z.literal("offer"), price: money.refine((n) => n > 0, "Enter a price"), content: str(300).optional() }),
  z.object({ kind: z.literal("fulfillment"), mode: z.enum(["pickup", "delivery"]), content: str(300).optional() }),
]);

export const messageRespond = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("decline") }),
  z.object({ action: z.literal("counter"), price: money.refine((n) => n > 0, "Enter a price") }),
]);

export const adQuote = z.object({
  durationSec: z.coerce.number().min(1).max(60),
  planDays: z.coerce.number().refine((n) => AD_PLANS.some((p) => p.days === n), "Pick a plan"),
});

export const adCreate = adQuote.extend({
  title: str(160).min(3, "Give your ad a title"),
  description: optStr(500),
  videoUrl: z.string().regex(/^\/api\/media\/[^/?#]+\.(mp4|mov)$/, "Upload an MP4 or MOV video"),
});

export const adPay = z.discriminatedUnion("method", [
  z.object({ method: z.literal("upi"), upiId: z.string().trim().regex(/^[a-z0-9._-]{2,}@[a-z]{2,}$/i, "Enter a valid UPI ID") }),
  z.object({
    method: z.literal("card"),
    cardName: str(80).min(2, "Enter the name on card"),
    cardNumber: z.string().transform((v) => v.replace(/\s/g, "")).refine((v) => /^\d{13,19}$/.test(v), "Enter a valid card number"),
    expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY"),
    cvv: z.string().trim().regex(/^\d{3,4}$/, "Enter the CVV"),
  }),
]);

const gstinRule = z.string().trim().toUpperCase().regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 characters");

export const wholesalerProfile = z.object({
  businessName: str(160).min(2, "Business name is required"),
  description: optStr(1000),
  dpUrl: urlOrPath.optional().nullable(),
  gstin: gstinRule.optional().nullable(),
  phone,
  address: optStr(300),
  locality: optStr(120),
  city: z.enum(CITIES),
  pincode: z.string().trim().refine(isNcrPincode, "Use an NCR pincode (Delhi 110xxx, Noida 201xxx, Gurugram 122xxx)"),
});

export const wholesalerProfilePatch = wholesalerProfile.partial();

export const wholesalerProductInput = z.object({
  name: str(160).min(2, "Name is required"),
  category: z.enum(CATEGORIES),
  imageUrl: urlOrPath.optional().nullable(),
  weightValue: z.coerce.number().min(0).max(100000),
  weightUnit: z.enum(WEIGHT_UNITS),
  price: money.refine((n) => n > 0, "Price must be more than 0"),
  moq: z.coerce.number().int().min(1).max(100000),
  stockQty: z.coerce.number().int().min(0).max(1_000_000),
  grade: z.enum(["A", "B", "C"]),
  inStock: z.boolean(),
});

export const wholesalerProductPatch = wholesalerProductInput.partial();

export const restockCreate = z.object({
  wholesalerIds: z.array(z.uuid()).min(1, "Pick at least one wholesaler").max(20),
  // Optional. When omitted, every out-of-stock item is sent.
  items: z.array(z.object({ productId: z.uuid(), qty: z.coerce.number().int().min(1).max(10000) })).optional(),
});

export const restockLineAction = z.object({ action: z.enum(["accept", "decline", "received"]) });

export const restockQuotes = z.object({
  quotes: z
    .array(z.object({ lineId: z.uuid(), price: money.refine((n) => n > 0, "Enter a price"), qty: z.coerce.number().int().min(0).max(100000) }))
    .min(1),
});

export const profilePatch = z.object({
  name: str(120).min(2, "Enter your name"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => v === "" || /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number")
    .optional(),
});

export const supportCreate = z.object({
  name: str(120).min(2, "Enter your name"),
  contact: str(160).min(5, "Add an email or phone so we can reply"),
  topic: z.enum(["order", "payment", "delivery", "account", "vendor", "wholesale", "other"]),
  orderRef: z.string().trim().max(40).optional(),
  message: str(2000).min(10, "Tell us a little more (at least 10 characters)"),
});

export const supportPatch = z.object({ status: z.enum(["open", "resolved"]) });

export const adReview = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(300).optional(),
});

export const featuredInput = z.object({
  title: str(160).min(3, "Give the clip a title"),
  subtitle: optStr(160),
  videoUrl: z
    .string()
    .trim()
    .refine((v) => /^\/api\/media\/[^/?#]+\.(mp4|mov)$/.test(v) || /^\/demo-ads\/[^/?#]+\.mp4$/.test(v) || /^https:\/\/.+\.mp4$/.test(v), "Upload an MP4 video or paste an https MP4 link"),
  durationSec: z.coerce.number().int().min(1).max(60).default(15),
  storeId: z.union([z.uuid(), z.null()]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const featuredPatch = featuredInput.partial();

export const adminStorePatch = z.object({
  shopName: str(160).min(2).optional(),
  plan: z.enum(["basic", "premium"]).optional(),
  isOpen: z.boolean().optional(),
  pickupAvailable: z.boolean().optional(),
  deliveryAvailable: z.boolean().optional(),
  deliveryFee: money.optional(),
  freeDeliveryAbove: money.optional(),
  minOrder: money.optional(),
});

export const adminWholesalerPatch = z.object({
  businessName: str(160).min(2).optional(),
  isVerified: z.boolean().optional(),
});
