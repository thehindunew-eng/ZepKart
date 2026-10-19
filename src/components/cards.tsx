"use client";

import Link from "next/link";
import { inr } from "@/lib/utils";
import { Badge, OpenBadge } from "./ui";

export type StoreLite = {
  id: string;
  shopName: string;
  description: string | null;
  dpUrl: string | null;
  city: string | null;
  category: string | null;
  isOpen: boolean;
  nextOpeningAt: string | null;
  nextClosingAt: string | null;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  rating: string | null;
  whatsapp: string | null;
};

export function StoreCard({ s }: { s: StoreLite }) {
  return (
    <Link href={`/stores/${s.id}`} className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)]">
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <img src={s.dpUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"} alt={s.shopName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute left-3 top-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${s.isOpen ? "bg-green-600" : "bg-neutral-900"}`}>
            <span className={`h-1.5 w-1.5 rounded-full live-dot ${s.isOpen ? "bg-green-200" : "bg-red-400"}`} />
            {s.isOpen ? "OPEN" : "CLOSED"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[16px] font-black leading-tight text-white drop-shadow">{s.shopName}</p>
            <p className="text-[12px] font-medium text-white/85">{s.city} · {s.category}</p>
          </div>
          <span className="rounded-xl bg-white/95 px-2 py-1 text-[12px] font-black text-gray-900">★ {Number(s.rating ?? 4.5).toFixed(1)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3">
        {s.deliveryAvailable && <Badge tone="green">🛵 Delivery</Badge>}
        {s.pickupAvailable && <Badge tone="blue">🏃 Pickup</Badge>}
        <span className="ml-auto text-[11px] font-semibold text-gray-400">{s.isOpen ? s.nextClosingAt : s.nextOpeningAt}</span>
      </div>
    </Link>
  );
}

export type ProductLite = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  mrp: string | null;
  weight: string | null;
  stockQty: number;
  status: string;
  category: string | null;
  store?: StoreLite | null;
  storeId: string;
};

export function ProductCard({ p, optimistic }: { p: ProductLite; optimistic?: boolean }) {
  const oos = p.status === "oos" || p.stockQty <= 0;
  const off = p.mrp && Number(p.mrp) > Number(p.price) ? Math.round((1 - Number(p.price) / Number(p.mrp)) * 100) : 0;
  return (
    <Link
      href={`/products/${p.id}`}
      className={`group relative overflow-hidden rounded-3xl border bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] ${oos ? "border-gray-200" : "border-gray-200"} ${optimistic ? "opacity-70" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img src={p.imageUrl || ""} alt={p.name} className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${oos ? "grayscale" : ""}`} loading="lazy" />
        {off > 0 && !oos && <span className="absolute left-3 top-3 rounded-lg bg-green-700 px-2 py-1 text-[11px] font-black text-white">{off}% OFF</span>}
        {oos && (
          <span className="absolute inset-0 grid place-items-center bg-white/55">
            <span className="rounded-xl bg-neutral-900 px-3 py-1.5 text-[12px] font-black uppercase tracking-wide text-white">Out of stock</span>
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">{p.weight}</span>
      </div>
      <div className="p-3.5">
        {p.store && <p className="truncate text-[11px] font-bold uppercase tracking-wide text-green-700">{p.store.shopName}</p>}
        <p className="mt-0.5 truncate text-[14.5px] font-bold">{p.name}</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[16px] font-black">{inr(p.price)}</span>
          {p.mrp && Number(p.mrp) > Number(p.price) && <span className="text-[12px] font-semibold text-gray-400 line-through">{inr(p.mrp)}</span>}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[11px] font-bold ${oos ? "text-red-600" : p.stockQty < 15 ? "text-amber-600" : "text-green-700"}`}>
            {oos ? "● OOS — ask vendor" : p.stockQty < 15 ? `● Only ${p.stockQty} left` : "● In stock · live"}
          </span>
          <span className="rounded-xl bg-gray-900 px-3 py-1.5 text-[12px] font-bold text-white group-hover:bg-green-700">{oos ? "Notify" : "+ Add"}</span>
        </div>
      </div>
    </Link>
  );
}

export function PromoStrip({ promos }: { promos: Array<{ id: string; title: string; videoUrl: string | null; thumbnailUrl: string | null; store?: { shopName: string } | null; season: string }> }) {
  if (!promos.length) return null;
  return (
    <div className="overflow-hidden rounded-3xl bg-neutral-950 p-5 text-white sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-300">● Live Ads · Sponsored</p>
          <h3 className="mt-1 text-[20px] font-black">60-sec store stories</h3>
        </div>
        <span className="hidden rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-bold sm:block">Vendors pay per season for this slot</span>
      </div>
      <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-1">
        {promos.map((v) => (
          <div key={v.id} className="w-[260px] shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
            <video src={v.videoUrl || ""} poster={v.thumbnailUrl || ""} controls preload="metadata" className="h-[150px] w-full bg-black object-cover" />
            <div className="p-3">
              <p className="clamp2 text-[13px] font-bold leading-snug">{v.title}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/60">{v.store?.shopName} · {v.season} slot</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
