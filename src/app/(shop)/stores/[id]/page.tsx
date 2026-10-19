"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Phone, Truck, Footprints, Wallet, Film, Clock, MapPin } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useCart } from "@/components/CartProvider";
import { ProductCard, useCartActions, type ShopProduct, type ShopService } from "@/components/cards";
import { Badge, Button, EmptyState, Glass, Skeleton, StatusPill } from "@/components/ui";
import { CATEGORY_EMOJI, money } from "@/lib/utils";

type StoreResp = {
  store: { id: string; shopName: string; description: string | null; dpUrl: string | null; coverUrl: string | null; whatsapp: string | null; address: string | null; locality: string | null; city: string; category: string; isOpen: boolean; nextOpeningAt: string | null; nextClosingAt: string | null; openingHours: string | null; pickupAvailable: boolean; deliveryAvailable: boolean; deliveryFee: number; freeDeliveryAbove: number; minOrder: number; etaMinutes: number; rating: number };
  products: ShopProduct[];
  services: ShopService[];
  ads: { id: string; title: string; videoUrl: string; durationSec: number }[];
};

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useApi<StoreResp>(`/api/stores/${id}`, { poll: 15000 });
  const { cart, count } = useCart();
  const { addService } = useCartActions();
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");

  const categories = useMemo(() => ["All", ...new Set((data?.products ?? []).map((p) => p.category))], [data]);
  const shown = (data?.products ?? []).filter((p) => (cat === "All" || p.category === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));

  if (loading && !data) return <div className="space-y-6"><Skeleton className="h-64" /><Skeleton className="h-96" /></div>;
  if (!data) return <Glass><EmptyState title="This store isn't available" action={<Link href="/"><Button variant="soft">Browse stores</Button></Link>} /></Glass>;

  const s = data.store;
  const basketHere = cart.storeId === s.id ? count : 0;
  const basketTotal = cart.storeId === s.id ? cart.items.reduce((a, i) => a + i.price * i.qty, 0) + cart.services.reduce((a, x) => a + x.price * x.qty, 0) : 0;

  return (
    <div className="space-y-8 pb-24">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink/65 hover:text-ink"><ArrowLeft className="h-4 w-4" /> All stores</Link>

      <Glass className="relative overflow-hidden !rounded-[32px]">
        <div className="h-36 bg-gradient-to-br from-amber-200 via-orange-200 to-emerald-200 sm:h-48" style={s.coverUrl ? { backgroundImage: `url(${s.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-7">
          <div className="-mt-16 h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl sm:-mt-20 sm:h-28 sm:w-28">
            {s.dpUrl ? <img src={s.dpUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-4xl">{CATEGORY_EMOJI[s.category] ?? "🛒"}</div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-black tracking-tight sm:text-[34px]">{s.shopName}</h1>
              <StatusPill isOpen={s.isOpen} nextOpeningAt={s.nextOpeningAt} nextClosingAt={s.nextClosingAt} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink/60"><MapPin className="h-3.5 w-3.5" /> {s.address ?? `${s.locality}, ${s.city}`}</p>
            {s.description && <p className="mt-2 max-w-2xl text-[14px] text-ink/70">{s.description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {s.pickupAvailable && <Badge tone="blue"><Footprints className="h-3 w-3" /> Pickup</Badge>}
              {s.deliveryAvailable && <Badge tone="purple"><Truck className="h-3 w-3" /> Delivery in {s.etaMinutes} min</Badge>}
              {s.deliveryAvailable && <Badge tone="gray">Delivery {s.deliveryFee > 0 ? money(s.deliveryFee) : "free"}{s.freeDeliveryAbove > 0 ? ` · free above ${money(s.freeDeliveryAbove)}` : ""}</Badge>}
              {s.minOrder > 0 && <Badge tone="gray"><Wallet className="h-3 w-3" /> Min order {money(s.minOrder)}</Badge>}
              {s.openingHours && <Badge tone="gray"><Clock className="h-3 w-3" /> {s.openingHours}</Badge>}
            </div>
          </div>
          {s.whatsapp && (
            <a href={`https://wa.me/91${s.whatsapp.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noreferrer" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[14px] font-bold text-white shadow-lg transition hover:bg-emerald-700">
              <Phone className="h-4 w-4" /> WhatsApp shop
            </a>
          )}
        </div>
      </Glass>

      {data.ads.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-[18px] font-black tracking-tight"><Film className="h-4 w-4" /> From this store</h2>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {data.ads.map((a) => (
              <Glass key={a.id} className="w-64 shrink-0 overflow-hidden !rounded-[24px]">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={a.videoUrl} muted autoPlay loop playsInline className="aspect-[9/12] max-h-72 w-full bg-black object-cover" />
                <p className="p-3 text-[13.5px] font-bold">{a.title}</p>
              </Glass>
            ))}
          </div>
        </section>
      )}

      {data.services.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[18px] font-black tracking-tight">Extra services</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.services.map((sv) => {
              const qty = cart.services.find((x) => x.serviceId === sv.id)?.qty ?? 0;
              return (
                <Glass key={sv.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-extrabold">{sv.title}</p>
                    {sv.description && <p className="line-clamp-2 text-[12.5px] text-ink/55">{sv.description}</p>}
                    <p className="mt-1 text-[13.5px] font-black">{money(sv.price)} <span className="text-[11.5px] font-semibold text-ink/50">{sv.unitLabel}</span></p>
                  </div>
                  <Button size="sm" variant={qty ? "dark" : "soft"} disabled={!sv.isActive} onClick={() => addService(sv, s.id, s.shopName)}>{qty ? `Added · ${qty}` : "Add"}</Button>
                </Glass>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] font-black tracking-tight">Items in stock</h2>
          <input className="field !w-56 !rounded-full !py-2" placeholder="Search this shop" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search this shop" />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${cat === c ? "bg-ink text-white" : "glass-pill text-ink/70"}`}>{c}</button>
          ))}
        </div>
        {loading && !data ? null : shown.length === 0 ? (
          <Glass><EmptyState title={q ? "No items match that search" : "No items listed yet"} body="Shops add new stock often. Check back soon." /></Glass>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => <ProductCard key={p.id} p={{ ...p, storeOpen: s.isOpen, storeName: s.shopName }} showStore={false} />)}
          </div>
        )}
      </section>

      {basketHere > 0 && (
        <div className="fixed inset-x-3 bottom-20 z-30 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full bg-ink px-5 py-3 text-white shadow-2xl lg:bottom-6">
          <span className="text-[13.5px] font-bold">{basketHere} items · {money(basketTotal)}</span>
          <Link href="/cart"><Button variant="gold" size="md">View basket</Button></Link>
        </div>
      )}
    </div>
  );
}
