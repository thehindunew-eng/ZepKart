"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Badge, EmptyState, OpenBadge, Skeleton } from "@/components/ui";
import { ProductCard } from "@/components/cards";
import { ChatPanel } from "@/components/ChatPanel";
import { inr, waLink } from "@/lib/utils";

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inventory" | "facilities" | "videos" | "chat">("inventory");
  const [filter, setFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/stores/${id}`, { cache: "no-store" });
    const j = await r.json();
    setData(j);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
          <Skeleton className="h-64" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-56" />)}</div>
        </div>
      </div>
    );
  }
  if (!data?.store) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-xl px-4 py-16"><EmptyState title="Store not found" hint="It may have been removed." action={<Link href="/" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white">Back home</Link>} /></div>
      </div>
    );
  }
  const s = data.store;
  const products = (data.products ?? []).filter((p: any) => filter === "All" || (filter === "Available" ? p.status !== "oos" : p.status === "oos"));
  const facilities = data.facilities ?? [];
  const promos = data.promos ?? [];

  return (
    <div className="min-h-screen">
      <Header />
      {/* cover */}
      <div className="relative h-56 overflow-hidden bg-gray-900 sm:h-72">
        <img src={s.dpUrl} className="h-full w-full object-cover opacity-90" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-5">
          <Link href="/" className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur hover:bg-white/25">← All stores</Link>
          <div className="flex flex-wrap items-end gap-4">
            <img src={s.dpUrl} className="h-20 w-20 rounded-3xl border-4 border-white object-cover shadow-xl sm:h-24 sm:w-24" alt="" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[26px] font-black text-white drop-shadow sm:text-[32px]">{s.shopName}</h1>
              <p className="text-[13px] font-medium text-white/80">{s.address} · {s.city}</p>
            </div>
            <div className="flex gap-2">
              <a href={waLink(s.whatsapp, `Hi ${s.shopName}! I found you on ZapKart. Is home delivery available?`)} target="_blank" className="rounded-2xl bg-[#25D366] px-4 py-2.5 text-[13.5px] font-black text-white shadow-lg">💬 WhatsApp</a>
              <a href={`tel:${s.phone}`} className="rounded-2xl bg-white px-4 py-2.5 text-[13.5px] font-black text-gray-900">📞 Call</a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <OpenBadge isOpen={s.isOpen} nextOpeningAt={s.nextOpeningAt} nextClosingAt={s.nextClosingAt} />
          <span className="text-[12px] font-bold text-gray-400">·</span>
          <span className="text-[12.5px] font-bold text-gray-600">🕒 {s.openingHours}</span>
          <span className="ml-auto flex gap-2">
            {s.deliveryAvailable && <Badge tone="green">🛵 Delivery {inr(s.deliveryFee)} · {s.deliveryRadiusKm}km</Badge>}
            {s.pickupAvailable && <Badge tone="blue">🏃 Pickup free</Badge>}
            <Badge tone="black">★ {Number(s.rating ?? 4.5).toFixed(1)}</Badge>
          </span>
        </div>
        <p className="mx-auto mt-3 max-w-3xl text-center text-[14px] leading-relaxed text-gray-600">{s.description}</p>

        {/* tabs */}
        <div className="sticky top-[65px] z-20 mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white/90 p-1.5 backdrop-blur no-scrollbar">
          {([["inventory", `📦 Inventory (${data.products?.length ?? 0})`], ["facilities", `✨ Facilities (${facilities.length})`], ["videos", `▶ Videos (${promos.length})`], ["chat", "💬 Chat with store"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-xl px-4 py-2.5 text-[13.5px] font-black ${tab === k ? "bg-neutral-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{label}</button>
          ))}
          <div className="ml-auto hidden items-center gap-2 pr-2 sm:flex">
            {["All", "Available", "OOS"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${filter === f ? "bg-green-700 text-white" : "bg-gray-100"}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {tab === "inventory" && (
            products.length === 0 ? <EmptyState title={filter === "All" ? "No items yet" : `No ${filter} items`} hint="Vendors update stock live — check back soon or ask in chat." /> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((p: any) => <ProductCard key={p.id} p={{ ...p, store: s }} />)}
              </div>
            )
          )}
          {tab === "facilities" && (
            facilities.length === 0 ? <EmptyState title="No extra facilities" hint="This store hasn't listed services like grinding, rentals or subscriptions yet." /> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {facilities.map((f: any) => (
                  <div key={f.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                    {f.imageUrl && <img src={f.imageUrl} className="h-40 w-full object-cover" alt="" />}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-black">{f.title}</p>
                        {!f.isActive && <Badge tone="gray">paused</Badge>}
                      </div>
                      <p className="mt-1 text-[13px] text-gray-500">{f.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[18px] font-black text-green-700">{Number(f.price) === 0 ? "FREE" : inr(f.price)} <span className="text-[11px] font-bold text-gray-400">{f.unit}</span></span>
                        <a href={waLink(s.whatsapp, `Hi! I want to book "${f.title}" (${inr(f.price)} ${f.unit}). Is it available?`)} target="_blank" className="rounded-xl bg-neutral-900 px-4 py-2 text-[13px] font-bold text-white">Book →</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === "videos" && (
            promos.length === 0 ? <EmptyState title="No video ads yet" hint="Vendors can upload 60-sec promos charged per season." /> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {promos.map((v: any) => (
                  <div key={v.id} className="overflow-hidden rounded-3xl bg-neutral-950 text-white">
                    <video src={v.videoUrl} poster={v.thumbnailUrl} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
                    <div className="p-4">
                      <p className="text-[14px] font-black">{v.title}</p>
                      <p className="mt-1 text-[12.5px] text-white/60">{v.description}</p>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-lime-300">{v.season} slot · {v.durationSec}s</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {tab === "chat" && (
            <div className="mx-auto max-w-3xl">
              <ChatPanel storeId={s.id} />
              <p className="mt-2 text-center text-[12px] text-gray-500">Tip: for price bargaining go to a specific item — every product has its own thread.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
