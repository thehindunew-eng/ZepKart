"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Store, Film, Sparkles, MapPin } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { ProductCard, StoreCard, type ShopProduct, type ShopStore } from "@/components/cards";
import { EmptyState, Glass, Skeleton, VisitStoreButton, Button } from "@/components/ui";
import { CITIES } from "@/lib/ncr";
import { cn } from "@/lib/utils";
import Link from "next/link";

type AdItem = { id: string; title: string; description: string | null; videoUrl: string; durationSec: number; storeId: string; storeName: string; storeLocality: string | null; city: string };

function HomeInner() {
  const params = useSearchParams();
  const [city, setCity] = useState<string>("");
  const q = params.get("q")?.trim() ?? "";
  const qs = (extra: Record<string, string> = {}) => {
    const u = new URLSearchParams({ ...(city ? { city } : {}), ...(q ? { q } : {}), ...extra });
    return u.toString() ? `?${u.toString()}` : "";
  };

  const ads = useApi<{ ads: AdItem[] }>("/api/ads/active");
  const stores = useApi<{ stores: ShopStore[] }>(`/api/stores${qs()}`, { poll: 30000 });
  const products = useApi<{ products: ShopProduct[] }>(`/api/products${qs({ limit: "24" })}`, { poll: 30000 });

  const adList = useMemo(() => (ads.data?.ads ?? []).filter((a) => !city || a.city === city), [ads.data, city]);

  return (
    <div className="space-y-10">
      <section className="glass relative overflow-hidden !rounded-[32px] p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[12px] font-bold text-emerald-900 shadow-sm"><MapPin className="h-3.5 w-3.5" /> Delhi · Noida · Gurugram</p>
          <h1 className="mt-4 text-[32px] font-black leading-[1.05] tracking-[-0.03em] sm:text-[46px]">Fresh from the stores around you.</h1>
          <p className="mt-3 max-w-xl text-[15px] text-ink/65">Pick up in minutes or get it delivered. Chat with the shop, ask for a better price, and book in one tap.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["", ...CITIES].map((c) => (
              <button key={c || "all"} onClick={() => setCity(c)} className={cn("rounded-full px-4 py-2 text-[13px] font-bold transition", city === c ? "bg-ink text-white shadow-lg" : "glass-pill text-ink/75 hover:bg-white/90")}>
                {c || "All NCR"}
              </button>
            ))}
          </div>
          <form action="/" className="mt-5 flex max-w-xl items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input name="q" defaultValue={q} className="field !rounded-full pl-10" placeholder="Search items or stores" aria-label="Search" />
            </div>
            <Button type="submit" variant="dark" size="md">Search</Button>
          </form>
        </div>
      </section>

      {(ads.loading || adList.length > 0) && (
        <section className="space-y-4">
          <SectionHead icon={<Film className="h-4 w-4" />} title="Featured from stores" sub="Short videos from stores running promotions right now" />
          {ads.loading ? (
            <div className="flex gap-4 overflow-hidden">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-72 shrink-0" />)}</div>
          ) : (
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {adList.map((a) => (
                <Glass key={a.id} className="rise w-[300px] shrink-0 snap-start overflow-hidden !rounded-[26px]">
                  <div className="relative aspect-[9/12] max-h-[300px] bg-black/80">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={a.videoUrl} muted autoPlay loop playsInline className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold text-white">{a.durationSec}s</span>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-[14.5px] font-extrabold leading-snug">{a.title}</p>
                    <p className="truncate text-[12.5px] text-ink/55">{a.storeName} · {a.storeLocality}</p>
                    <VisitStoreButton storeId={a.storeId} />
                  </div>
                </Glass>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <SectionHead icon={<Store className="h-4 w-4" />} title={q ? `Stores matching “${q}”` : "Stores near you"} sub="Open stores show first" />
        {stores.loading && !stores.data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52" />)}</div>
        ) : (stores.data?.stores.length ?? 0) === 0 ? (
          <Glass><EmptyState title="No stores found here yet" body="Try another area or clear the search. New stores join every week." action={<Button variant="soft" onClick={() => setCity("")}>Show all NCR</Button>} /></Glass>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stores.data!.stores.map((s) => <StoreCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHead icon={<Sparkles className="h-4 w-4" />} title="Available now" sub="Freshly stocked items from stores near you" />
        {products.loading && !products.data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}</div>
        ) : (products.data?.products.length ?? 0) === 0 ? (
          <Glass><EmptyState title="Nothing matches right now" body="Stores update stock live. Check back in a few minutes or try another search." /></Glass>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.data!.products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      <Link href="/auth?role=vendor&mode=signup" className="block">
        <Glass className="flex flex-col items-start justify-between gap-4 p-6 transition hover:-translate-y-0.5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[16px] font-extrabold">Have a store in NCR?</p>
            <p className="text-[13.5px] text-ink/60">Open your shop on ZepKart in a few minutes and start taking bookings.</p>
          </div>
          <span className="btn-dark inline-flex h-11 items-center rounded-full px-5 text-[14px] font-bold">Start selling</span>
        </Glass>
      </Link>
    </div>
  );
}

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-[20px] font-black tracking-tight">{icon} {title}</h2>
        <p className="text-[13px] text-ink/55">{sub}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <HomeInner />
    </Suspense>
  );
}
