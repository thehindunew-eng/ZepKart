"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Store, Film, MapPin, ArrowRight } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { useApi } from "@/hooks/useApi";
import { useLocation } from "@/hooks/useLocation";
import { ProductCard, StoreCard, type ShopProduct, type ShopStore } from "@/components/cards";
import { Button, EmptyState, Skeleton, VisitStoreButton } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { CITIES, CATEGORIES } from "@/lib/ncr";
import { CATEGORY_EMOJI, cn } from "@/lib/utils";

type AdItem = { id: string; title: string; description: string | null; videoUrl: string; durationSec: number; storeId: string; storeName: string; storeLocality: string | null; city: string };
type SortKey = "default" | "price" | "distance";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price", label: "Cheapest first" },
  { key: "distance", label: "Nearest first" },
  { key: "default", label: "Relevant" },
];

function HomeInner() {
  const params = useSearchParams();
  const { user } = useAuth();
  const point = useLocation();
  const [city, setCity] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("price");
  const q = params.get("q")?.trim() ?? "";
  const geo = `lat=${point.lat}&lng=${point.lng}`;

  const storeQs = new URLSearchParams({ ...(city ? { city } : {}), ...(q ? { q } : {}), sort: sort === "distance" ? "distance" : "default" });
  const productQs = new URLSearchParams({ ...(city ? { city } : {}), ...(q ? { q } : {}), ...(category ? { category } : {}), sort, limit: "24" });

  const ads = useApi<{ ads: AdItem[] }>("/api/featured");
  const stores = useApi<{ stores: ShopStore[] }>(`/api/stores?${storeQs}&${geo}`, { poll: 30000 });
  const products = useApi<{ products: ShopProduct[] }>(`/api/products?${productQs}&${geo}`, { poll: 30000 });

  const adList = useMemo(() => (ads.data?.ads ?? []).filter((a) => !city || a.city === city), [ads.data, city]);
  const isCustomerView = user?.role !== "vendor" && user?.role !== "wholesaler";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#052e16] via-leaf-deep to-leaf p-6 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-0 right-24 h-40 w-40 rounded-full bg-gold/30 blur-2xl" />
        <div className="relative max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold">
            <MapPin className="h-3.5 w-3.5" /> Delhi · Noida · Gurugram
          </p>
          <h1 className="mt-3 text-[28px] font-black leading-tight tracking-tight sm:text-[38px]">Groceries from stores near you</h1>
          <p className="mt-2 text-[14.5px] text-white/80">Compare prices across nearby shops and pick up or get it delivered.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["", ...CITIES].map((c) => (
              <button key={c || "all"} onClick={() => setCity(c)} className={cn("rounded-full px-4 py-2 text-[13px] font-bold transition", city === c ? "bg-white text-ink" : "bg-white/15 text-white hover:bg-white/25")}>
                {c || "All NCR"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="md:hidden">
        <SearchBox />
      </div>

      <section className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <CategoryChip label="All" emoji="🛒" active={!category} onClick={() => setCategory("")} />
        {CATEGORIES.map((c) => (
          <CategoryChip key={c} label={c} emoji={CATEGORY_EMOJI[c] ?? "🛍️"} active={category === c} onClick={() => setCategory(category === c ? "" : c)} />
        ))}
      </section>


      {(ads.loading || adList.length > 0) && (
        <section className="space-y-3">
          <SectionHead icon={<Film className="h-4 w-4" />} title="Featured from stores" />
          {ads.loading ? (
            <div className="flex gap-4 overflow-hidden">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-60 w-64 shrink-0" />)}</div>
          ) : (
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {adList.map((a) => (
                <div key={a.id} className="w-[250px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="relative aspect-[9/13] max-h-[280px] bg-black">
                    { }
                    <video src={a.videoUrl} muted autoPlay loop playsInline className="h-full w-full object-cover" />
                    <span className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">{a.durationSec}s</span>
                  </div>
                  <div className="space-y-2 p-3.5">
                    <p className="clamp2 text-[13.5px] font-extrabold leading-snug">{a.title}</p>
                    <p className="truncate text-[12px] text-ink/55">{a.storeName} · {a.storeLocality}</p>
                    <VisitStoreButton storeId={a.storeId} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHead icon={<Store className="h-4 w-4" />} title={q ? `Stores matching “${q}”` : "Stores near you"} />
          <p className="text-[12.5px] font-semibold text-ink/50">{point.precise ? "Using your location" : `Distances from ${point.label}`}</p>
        </div>
        {stores.loading && !stores.data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>
        ) : (stores.data?.stores.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white">
            <EmptyState title="No stores found here yet" body="Try another area or clear the search." action={<Button variant="soft" onClick={() => setCity("")}>Show all NCR</Button>} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stores.data!.stores.map((s) => <StoreCard key={s.id} s={s} />)}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHead icon={<Store className="h-4 w-4" />} title={category ? category : "Items available now"} />
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold transition", sort === s.key ? "border-ink bg-ink text-white" : "border-gray-200 bg-white text-ink/70 hover:border-gray-300")}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {products.loading && !products.data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}</div>
        ) : (products.data?.products.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white">
            <EmptyState title="Nothing matches right now" body="Stores update stock live. Check back soon or try another search." />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.data!.products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {isCustomerView && (
        <Link href="/auth?role=vendor&mode=signup" className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md sm:flex-row sm:items-center">
          <div>
            <p className="text-[16px] font-extrabold">Have a store in NCR?</p>
            <p className="text-[13.5px] text-ink/60">Open your shop on ZepKart and start taking bookings.</p>
          </div>
          <span className="btn-dark inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-[13.5px] font-bold">
            Start selling <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}
    </div>
  );
}

function CategoryChip({ label, emoji, active, onClick }: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex min-w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition", active ? "border-leaf bg-leaf/5" : "border-gray-200 bg-white hover:border-gray-300")}>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gray-50 text-2xl">{emoji}</span>
      <span className={cn("line-clamp-2 text-[11.5px] font-bold leading-tight", active ? "text-leaf-deep" : "text-ink/75")}>{label}</span>
    </button>
  );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <h2 className="flex items-center gap-2 text-[19px] font-black tracking-tight">{icon} {title}</h2>;
}

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <HomeInner />
    </Suspense>
  );
}
