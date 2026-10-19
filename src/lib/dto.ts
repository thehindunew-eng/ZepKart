import type { products, stores, extraServices, wholesalers } from "@/db/schema";
import { gstInclusive } from "@/lib/pricing";

type Product = typeof products.$inferSelect;
type Store = typeof stores.$inferSelect;
type Service = typeof extraServices.$inferSelect;

export const num = (v: string | number | null | undefined) => (v == null ? 0 : Number(v));

export function weightLabel(value: string | number, unit: string) {
  const n = Number(value);
  return unit === "pc" ? `${n} pc` : `${n} ${unit}`;
}

export const isAvailable = (p: Pick<Product, "inStock" | "stockQty">) => p.inStock && p.stockQty > 0;

/** Customer-facing product. Never includes the hidden auto-accept floor price. */
export function publicProduct(p: Product, store?: Pick<Store, "shopName" | "id" | "city" | "locality" | "isOpen" | "nextOpeningAt" | "nextClosingAt">) {
  return {
    id: p.id,
    storeId: p.storeId,
    storeName: store?.shopName,
    storeCity: store?.city,
    storeLocality: store?.locality,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    category: p.category,
    price: num(p.price),
    mrp: num(p.mrp),
    weightValue: num(p.weightValue),
    weightUnit: p.weightUnit,
    weightLabel: weightLabel(p.weightValue, p.weightUnit),
    available: isAvailable(p),
    stockLeft: p.stockQty <= 5 ? p.stockQty : null,
    bargainEnabled: p.bargainEnabled,
    gstRate: p.gstRate,
    gstIncluded: gstInclusive(num(p.price), p.gstRate),
    storeOpen: store?.isOpen,
  };
}

/** Vendor-facing product (includes stock controls and the floor price). */
export function vendorProduct(p: Product) {
  return {
    ...publicProduct(p),
    inStock: p.inStock,
    stockQty: p.stockQty,
    floorPrice: p.floorPrice == null ? null : num(p.floorPrice),
    updatedAt: p.updatedAt,
  };
}

/** Public store profile. Owner identity and personal phone numbers are not exposed. */
export function publicStore(s: Store) {
  return {
    id: s.id,
    shopName: s.shopName,
    description: s.description,
    dpUrl: s.dpUrl,
    coverUrl: s.coverUrl,
    whatsapp: s.whatsapp,
    address: s.address,
    locality: s.locality,
    city: s.city,
    pincode: s.pincode,
    category: s.category,
    isOpen: s.isOpen,
    nextOpeningAt: s.nextOpeningAt,
    nextClosingAt: s.nextClosingAt,
    openingHours: s.openingHours,
    pickupAvailable: s.pickupAvailable,
    deliveryAvailable: s.deliveryAvailable,
    deliveryFee: num(s.deliveryFee),
    freeDeliveryAbove: num(s.freeDeliveryAbove),
    minOrder: num(s.minOrder),
    etaMinutes: s.etaMinutes,
    rating: num(s.rating),
    lat: s.lat == null ? null : Number(s.lat),
    lng: s.lng == null ? null : Number(s.lng),
  };
}

export function publicService(s: Service) {
  return {
    id: s.id,
    storeId: s.storeId,
    title: s.title,
    description: s.description,
    imageUrl: s.imageUrl,
    price: num(s.price),
    unitLabel: s.unitLabel,
    gstRate: s.gstRate,
    isActive: s.isActive,
  };
}

/** Premium is active when the plan is premium and not yet expired. */
export function isPremium(s: { plan: string; planExpiresAt: Date | null }) {
  return s.plan === "premium" && !!s.planExpiresAt && s.planExpiresAt.getTime() > Date.now();
}

export function vendorStore(s: Store) {
  return {
    ...publicStore(s),
    phone: s.phone,
    ownerId: s.ownerId,
    updatedAt: s.updatedAt,
    plan: isPremium(s) ? "premium" : "basic",
    planExpiresAt: s.planExpiresAt,
  };
}

/** Wholesaler profile. Contact details are only shown to the wholesaler themself. */
export function wholesalerDto(w: typeof wholesalers.$inferSelect) {
  return {
    id: w.id,
    businessName: w.businessName,
    description: w.description,
    dpUrl: w.dpUrl,
    gstin: w.gstin,
    phone: w.phone,
    address: w.address,
    locality: w.locality,
    city: w.city,
    pincode: w.pincode,
    lat: w.lat == null ? null : Number(w.lat),
    lng: w.lng == null ? null : Number(w.lng),
    rating: num(w.rating),
    ratingCount: w.ratingCount,
    isVerified: w.isVerified,
  };
}

/** Directory entry shown to premium vendors. No phone, address, or GSTIN. */
export function publicWholesaler(w: typeof wholesalers.$inferSelect) {
  return {
    id: w.id,
    businessName: w.businessName,
    description: w.description,
    dpUrl: w.dpUrl,
    locality: w.locality,
    city: w.city,
    lat: w.lat == null ? null : Number(w.lat),
    lng: w.lng == null ? null : Number(w.lng),
    rating: num(w.rating),
    ratingCount: w.ratingCount,
    isVerified: w.isVerified,
  };
}

export function wholesalerProductDto(p: { id: string; name: string; category: string; imageUrl: string | null; weightValue: string | number; weightUnit: string; price: string | number; moq: number; stockQty: number; grade: string; inStock: boolean }) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    imageUrl: p.imageUrl,
    weightValue: num(p.weightValue),
    weightUnit: p.weightUnit,
    weightLabel: weightLabel(p.weightValue, p.weightUnit),
    price: num(p.price),
    moq: p.moq,
    stockQty: p.stockQty,
    grade: p.grade,
    inStock: p.inStock,
  };
}
