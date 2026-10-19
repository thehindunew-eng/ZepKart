"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { Badge, Button, ProductImage, Stepper, StatusPill, VisitStoreButton, Glass } from "@/components/ui";
import { money, percentOff } from "@/lib/utils";
import { Star, Clock, Truck, Footprints, Plus } from "lucide-react";

export type ShopProduct = {
  id: string;
  storeId: string;
  storeName?: string;
  storeLocality?: string;
  storeCity?: string;
  name: string;
  imageUrl: string | null;
  category: string;
  price: number;
  mrp: number;
  weightLabel: string;
  available: boolean;
  stockLeft: number | null;
  bargainEnabled: boolean;
  gstIncluded: number;
  storeOpen?: boolean;
};

export type ShopService = { id: string; title: string; description: string | null; price: number; unitLabel: string; gstRate: number; isActive: boolean };

/** Adds to the single-store basket, asking before replacing another store's items. */
export function useCartActions() {
  const { cart, addItem, addService, switchStore, clear } = useCart();
  const ensureStore = (storeId: string, storeName: string) => {
    if (cart.storeId && cart.storeId !== storeId && (cart.items.length || cart.services.length)) {
      if (!window.confirm(`Your basket has items from ${cart.storeName}. Start a new basket at ${storeName}?`)) return false;
      clear();
    }
    switchStore(storeId, storeName);
    return true;
  };
  return {
    cart,
    addProduct(p: ShopProduct, qty = 1) {
      if (!ensureStore(p.storeId, p.storeName ?? "store")) return false;
      return addItem({ productId: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, weightLabel: p.weightLabel }, qty);
    },
    addService(s: ShopService, storeId: string, storeName: string, qty = 1) {
      if (!ensureStore(storeId, storeName)) return false;
      return addService({ serviceId: s.id, title: s.title, price: s.price, unitLabel: s.unitLabel }, storeId, qty);
    },
  };
}

export function ProductCard({ p, showStore = true }: { p: ShopProduct; showStore?: boolean }) {
  const { cart, setItemQty } = useCart();
  const { addProduct } = useCartActions();
  const inBasket = cart.items.find((i) => i.productId === p.id)?.qty ?? 0;
  const off = percentOff(p.price, p.mrp);
  const canBuy = p.available && p.storeOpen !== false;
  return (
    <Glass className="rise group flex flex-col overflow-hidden !rounded-[24px] transition hover:-translate-y-0.5">
      <Link href={`/products/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-white/40">
        <ProductImage src={p.imageUrl} category={p.category} alt={p.name} className="transition duration-500 group-hover:scale-105" />
        {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-black text-white">{off}% off</span>}
        {!p.available && <span className="absolute inset-0 grid place-items-center bg-white/55 text-[13px] font-black uppercase tracking-wider text-ink/70 backdrop-blur-[2px]">Sold out</span>}
        {p.available && p.stockLeft != null && <span className="absolute bottom-3 left-3 rounded-full bg-amber-100/90 px-2 py-0.5 text-[11px] font-bold text-amber-900">Only {p.stockLeft} left</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <Link href={`/products/${p.id}`} className="clamp2 text-[14.5px] font-extrabold leading-snug tracking-tight hover:underline">
            {p.name}
          </Link>
          <p className="text-[12px] font-semibold text-ink/50">{p.weightLabel}</p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[17px] font-black tabular-nums">{money(p.price)}</p>
            {p.mrp > p.price && <p className="text-[12px] font-semibold text-ink/40 line-through">{money(p.mrp)}</p>}
          </div>
          {inBasket > 0 ? (
            <Stepper value={inBasket} size="sm" onChange={(v) => setItemQty(p.id, v)} max={50} />
          ) : (
            <Button size="sm" disabled={!canBuy} onClick={() => addProduct(p, 1)} aria-label={`Add ${p.name}`}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          )}
        </div>
        {showStore && p.storeName && (
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink/5 pt-3">
            <span className="truncate text-[12px] font-semibold text-ink/60">{p.storeName}</span>
            <VisitStoreButton storeId={p.storeId} label="Visit" />
          </div>
        )}
        {p.bargainEnabled && <Badge tone="gold" className="w-fit">Bargain on</Badge>}
      </div>
    </Glass>
  );
}

export type ShopStore = {
  id: string;
  shopName: string;
  description: string | null;
  dpUrl: string | null;
  locality: string | null;
  city: string;
  category: string;
  isOpen: boolean;
  nextOpeningAt: string | null;
  nextClosingAt: string | null;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  etaMinutes: number;
  rating: number;
  productCount?: number;
};

export function StoreCard({ s }: { s: ShopStore }) {
  return (
    <Glass className="rise flex flex-col gap-4 p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start gap-3.5">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/90 bg-white/70 shadow-sm">
          {s.dpUrl ? <img src={s.dpUrl} alt="" className="h-full w-full object-cover" /> : <ProductImage src={null} category="Grocery" alt="" />}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/stores/${s.id}`} className="block truncate text-[16px] font-extrabold tracking-tight hover:underline">
            {s.shopName}
          </Link>
          <p className="truncate text-[12.5px] font-semibold text-ink/55">
            {s.locality}, {s.city} · {s.category}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[12px] font-bold text-ink/65">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> {s.rating.toFixed(1)}
            <span className="text-ink/25">•</span>
            <Clock className="h-3.5 w-3.5" /> {s.etaMinutes} min
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill compact isOpen={s.isOpen} nextOpeningAt={s.nextOpeningAt} nextClosingAt={s.nextClosingAt} />
        {s.pickupAvailable && <Badge tone="blue"><Footprints className="h-3 w-3" /> Pickup</Badge>}
        {s.deliveryAvailable && <Badge tone="purple"><Truck className="h-3 w-3" /> Delivery</Badge>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-ink/55">{s.productCount != null ? `${s.productCount} items in stock` : ""}</span>
        <div className="flex gap-2">
          <VisitStoreButton storeId={s.id} label="Visit store" />
        </div>
      </div>
    </Glass>
  );
}
