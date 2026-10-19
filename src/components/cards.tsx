"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { Stepper, ProductImage } from "@/components/ui";
import { money, percentOff } from "@/lib/utils";
import { Clock, Truck, Footprints, Plus, Star, MapPin } from "lucide-react";

export type ShopProduct = {
  id: string;
  storeId: string;
  storeName?: string;
  storeLocality?: string | null;
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
  distanceKm?: number | null;
};

export type ShopService = { id: string; title: string; description: string | null; price: number; unitLabel: string; gstRate: number; isActive: boolean };

export type ShopStore = {
  id: string;
  shopName: string;
  description: string | null;
  dpUrl: string | null;
  city: string;
  locality?: string | null;
  category: string;
  isOpen: boolean;
  nextOpeningAt: string | null;
  nextClosingAt: string | null;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  rating: number;
  productCount?: number;
  distanceKm?: number | null;
  lat?: number | null;
  lng?: number | null;
};

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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <Link href={`/products/${p.id}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <ProductImage src={p.imageUrl} category={p.category} alt={p.name} className={`transition duration-500 group-hover:scale-105 ${!p.available ? "grayscale" : ""}`} />
        {off > 0 && p.available && <span className="absolute left-2.5 top-2.5 rounded-md bg-leaf px-1.5 py-0.5 text-[11px] font-black text-white">{off}% OFF</span>}
        {!p.available && (
          <span className="absolute inset-0 grid place-items-center bg-white/60">
            <span className="rounded-lg bg-ink px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">Out of stock</span>
          </span>
        )}
        <span className="absolute bottom-2.5 left-2.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-ink/80">{p.weightLabel}</span>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-black">{money(p.price)}</span>
          {p.mrp > p.price && <span className="text-[11.5px] font-semibold text-ink/40 line-through">{money(p.mrp)}</span>}
        </div>
        <Link href={`/products/${p.id}`} className="mt-1 line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink hover:text-leaf-deep">
          {p.name}
        </Link>
        {showStore && (
          <p className="mt-1 truncate text-[11.5px] text-ink/55">
            {p.storeName}
            {p.storeLocality ? ` · ${p.storeLocality}` : ""}
            {p.distanceKm != null ? ` · ${p.distanceKm} km` : ""}
          </p>
        )}
        <div className="mt-auto pt-3">
          {!p.available ? (
            <span className="block w-full rounded-xl bg-gray-100 py-2 text-center text-[12px] font-bold text-ink/55">Notify me</span>
          ) : inBasket > 0 ? (
            <Stepper size="sm" value={inBasket} onChange={(v) => setItemQty(p.id, v)} />
          ) : (
            <button
              disabled={!canBuy}
              onClick={() => addProduct(p, 1)}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-leaf/40 bg-leaf/5 py-2 text-[13px] font-black text-leaf-deep transition hover:bg-leaf hover:text-white disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StoreCard({ s }: { s: ShopStore }) {
  return (
    <Link href={`/stores/${s.id}`} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="relative h-36 overflow-hidden bg-gray-100">
        {s.dpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.dpUrl} alt={s.shopName} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-leaf/15 to-gold/20 text-4xl">🏪</div>
        )}
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-black tracking-wide text-white ${s.isOpen ? "bg-leaf" : "bg-ink"}`}>
          <span className={`h-1.5 w-1.5 rounded-full live-dot ${s.isOpen ? "bg-white" : "bg-red-400"}`} />
          {s.isOpen ? "OPEN" : "CLOSED"}
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[12px] font-black">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(s.rating ?? 4.5).toFixed(1)}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate text-[15.5px] font-black">{s.shopName}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-ink/55">
          {s.locality ? `${s.locality}, ` : ""}
          {s.city} · {s.category}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11.5px] font-bold">
          {s.deliveryAvailable && (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-green-800">
              <Truck className="h-3 w-3" /> Delivery
            </span>
          )}
          {s.pickupAvailable && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-sky-800">
              <Footprints className="h-3 w-3" /> Pickup
            </span>
          )}
          {s.distanceKm != null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-ink/70">
              <MapPin className="h-3 w-3" /> {s.distanceKm} km
            </span>
          )}
        </div>
        <p className="mt-2.5 flex items-center gap-1 text-[11.5px] font-semibold text-ink/50">
          <Clock className="h-3 w-3" /> {s.isOpen ? s.nextClosingAt : s.nextOpeningAt}
        </p>
      </div>
    </Link>
  );
}

