"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { StoreCard, ProductCard, PromoStrip, type StoreLite, type ProductLite } from "@/components/cards";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { CATEGORIES, inr } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

type Facility = { id: string; title: string; description: string | null; price: string; unit: string | null; imageUrl: string | null; storeId: string };
type Promo = { id: string; title: string; videoUrl: string | null; thumbnailUrl: string | null; season: string; store?: { shopName: string } | null };

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm font-bold text-gray-500">Loading bazaar…</div>}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const { user } = useAuth();
  const [q, setQ] = useState(initialQ);
  const [stores, setStores] = useState<StoreLite[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [cat, setCat] = useState("All");
  const [openOnly, setOpenOnly] = useState(false);
  const [avail, setAvail] = useState("All");
  const [city, setCity] = useState("All");

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const [s, p, v, f] = await Promise.all([
        fetch(`/api/stores?q=${encodeURIComponent(query)}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/products?q=${encodeURIComponent(query)}${cat !== "All" ? `&category=${cat}` : ""}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/promos`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/facilities`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      // auto-seed if empty
      if ((s.stores ?? []).length === 0 && (p.products ?? []).length === 0) {
        setSeeding(true);
        await fetch("/api/seed", { method: "POST" });
        const [s2, p2, v2, f2] = await Promise.all([
          fetch(`/api/stores?q=${encodeURIComponent(query)}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/products?q=${encodeURIComponent(query)}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/promos`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/facilities`, { cache: "no-store" }).then((r) => r.json()),
        ]);
        setStores(s2.stores ?? []);
        setProducts(p2.products ?? []);
        setPromos(v2.promos ?? []);
        setFacilities(f2.facilities ?? []);
        setSeeding(false);
      } else {
        setStores(s.stores ?? []);
        setProducts(p.products ?? []);
        setPromos(v.promos ?? []);
        setFacilities(f.facilities ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [cat]);

  useEffect(() => {
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  useEffect(() => {
    const t = setTimeout(() => load(q), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const cities = useMemo(() => ["All", ...Array.from(new Set(stores.map((s) => s.city).filter(Boolean) as string[]))], [stores]);

  const filteredStores = useMemo(() => {
    let r = stores;
    if (openOnly) r = r.filter((s) => s.isOpen);
    if (city !== "All") r = r.filter((s) => s.city === city);
    return r;
  }, [stores, openOnly, city]);

  const filteredProducts = useMemo(() => {
    let r = products;
    if (avail !== "All") r = r.filter((p) => (avail === "Available" ? p.status !== "oos" : p.status === "oos"));
    return r.slice(0, 24);
  }, [products, avail]);

  const openCount = stores.filter((s) => s.isOpen).length;
  const oosCount = products.filter((p) => p.status === "oos").length;

  return (
    <div className="min-h-screen">
      <Header onSearch={setQ} />

      {/* HERO */}
      <section className="hero-grid border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:py-14">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">● {openCount} stores open live</Badge>
              <Badge tone="amber">⚡ 10-min pickup · 30-min delivery</Badge>
              <Badge tone="purple">🤝 Bargain in chat</Badge>
            </div>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] font-black leading-[1.02] tracking-tight">
              Your bazaar,
              <br />
              <span className="bg-gradient-to-r from-green-700 via-green-600 to-lime-600 bg-clip-text text-transparent">live from the store shelf.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-600">
              See real stock with photo, price & weight. Bargain in item chat, choose <b>pickup or delivery</b>, pay on WhatsApp or at counter. Vendors update open/close, inventory & promos in real time.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href="#stores" className="rounded-2xl bg-neutral-900 px-5 py-3 text-[14px] font-bold text-white shadow-lg hover:bg-black">🛒 Shop live stores</a>
              {user?.role === "vendor" ? (
                <Link href="/vendor" className="rounded-2xl bg-green-700 px-5 py-3 text-[14px] font-bold text-white shadow-lg shadow-green-700/30 hover:bg-green-800">📊 Open vendor dashboard</Link>
              ) : (
                <Link href="/auth?mode=signup&role=vendor" className="rounded-2xl border-2 border-green-700 bg-green-50 px-5 py-3 text-[14px] font-bold text-green-800 hover:bg-green-100">🏪 Become a vendor — free</Link>
              )}
              <a href="#videos" className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-[14px] font-bold hover:bg-gray-50">▶ Watch 60-sec ads</a>
            </div>
            <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
              {[
                [String(stores.length || "—"), "live stores"],
                [String(products.length || "—"), "items tracked"],
                [`${oosCount}`, "marked OOS live"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-[20px] font-black">{loading ? "…" : n}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="animate-floaty overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between bg-neutral-900 px-4 py-3 text-white">
                <p className="text-[13px] font-bold">🔴 LIVE · FreshDaily Kirana</p>
                <span className="rounded-full bg-green-500 px-2.5 py-1 text-[11px] font-black">OPEN</span>
              </div>
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" className="h-52 w-full object-cover" alt="store" />
              <div className="space-y-2.5 p-4">
                {[
                  ["Desi Tomatoes · 1 kg", "₹42", "● In stock"],
                  ["A2 Cow Milk · 1 L", "₹68", "● In stock"],
                  ["Brown Eggs · 12 pcs", "OOS", "● OOS live"],
                ].map(([a, b, c]) => (
                  <div key={a} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <span className="text-[13px] font-bold">{a}</span>
                    <span className="ml-auto text-[13px] font-black">{b}</span>
                    <span className={`text-[11px] font-bold ${c.includes("OOS") ? "text-red-600" : "text-green-700"}`}>{c}</span>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <span className="flex-1 rounded-xl bg-green-700 py-2.5 text-center text-[13px] font-bold text-white">🤝 Bargain in chat</span>
                  <span className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-center text-[13px] font-bold text-white">🛵 Delivery / 🏃 Pickup</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xl sm:block">
              <p className="text-[12px] font-black">📲 WhatsApp ordering</p>
              <p className="text-[11px] text-gray-500">Every store shows its number</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8">
        {seeding && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-900">
            🌱 Seeding demo bazaar with vendors, inventory, chats & orders… one moment.
          </div>
        )}

        {/* categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold ${cat === c ? "border-neutral-900 bg-neutral-900 text-white" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              {c}
            </button>
          ))}
          <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold outline-none">
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => setOpenOnly(!openOnly)} className={`rounded-full border px-4 py-2 text-[13px] font-bold ${openOnly ? "border-green-700 bg-green-700 text-white" : "border-gray-200 bg-white"}`}>
              {openOnly ? "● Open only ✓" : "○ Open only"}
            </button>
          </div>
        </div>

        {/* STORES */}
        <section id="stores">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-[22px] font-black tracking-tight">🏪 Live stores near you</h2>
              <p className="text-[13px] text-gray-500">Green = open now · tap a store for inventory, facilities, videos & WhatsApp</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[12px] font-bold">{filteredStores.length} stores</span>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-60" />)}
            </div>
          ) : filteredStores.length === 0 ? (
            <EmptyState title="No stores match" hint="Try clearing search or city filter." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredStores.map((s) => <StoreCard key={s.id} s={s} />)}
            </div>
          )}
        </section>

        {/* PROMO VIDEOS */}
        <section id="videos">
          {loading ? <Skeleton className="h-56" /> : <PromoStrip promos={promos} />}
          <p className="mt-2 text-[12px] text-gray-500">💡 Vendors: 60-second promos are charged per season — Normal ₹99/day · Weekend ₹199 · Festive ₹349 · Peak ₹499. Upload from <Link href="/vendor/promos" className="font-bold text-green-700 underline">Vendor → Promotions</Link>.</p>
        </section>

        {/* PRODUCTS */}
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-black tracking-tight">🥬 Live inventory — photo · price · weight</h2>
              <p className="text-[13px] text-gray-500">Every card shows live stock. OOS items stay visible so you can ask the vendor in chat.</p>
            </div>
            <div className="flex gap-2">
              {["All", "Available", "OOS"].map((a) => (
                <button key={a} onClick={() => setAvail(a)} className={`rounded-full px-4 py-2 text-[12.5px] font-bold ${avail === a ? "bg-neutral-900 text-white" : "bg-white border border-gray-200"}`}>{a}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState title="No items found" hint="Try another keyword or category — vendors add stock live through the day." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>

        {/* FACILITIES */}
        <section>
          <div className="mb-4">
            <h2 className="text-[22px] font-black tracking-tight">✨ Extra facilities — beyond groceries</h2>
            <p className="text-[13px] text-gray-500">Atta grinding, live counters, subscriptions… vendors list paid extras to attract you.</p>
          </div>
          {loading ? <Skeleton className="h-40" /> : facilities.length === 0 ? <EmptyState title="No facilities yet" hint="Vendors can add services like delivery, grinding or rentals." /> : (
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {facilities.slice(0, 12).map((f) => (
                <div key={f.id} className="w-[280px] shrink-0 overflow-hidden rounded-3xl border border-gray-200 bg-white">
                  {f.imageUrl && <img src={f.imageUrl} className="h-32 w-full object-cover" alt="" loading="lazy" />}
                  <div className="p-4">
                    <p className="text-[14px] font-black">{f.title}</p>
                    <p className="clamp2 mt-1 text-[12.5px] text-gray-500">{f.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[15px] font-black text-green-700">{Number(f.price) === 0 ? "FREE" : `${inr(f.price)}`}<span className="ml-1 text-[11px] font-bold text-gray-400">{f.unit}</span></span>
                      <Link href={`/stores/${f.storeId}`} className="rounded-xl bg-gray-900 px-3 py-1.5 text-[12px] font-bold text-white">View store</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-green-900 p-6 text-white sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-300">For customers</p>
            <h3 className="mt-2 text-[24px] font-black">Bargain, then pickup or doorstep.</h3>
            <ol className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-white/85">
              <li><b className="text-white">1. Find it live</b> — photo, price, weight & OOS status update in real time.</li>
              <li><b className="text-white">2. Chat under the item</b> — offer a price, ask “delivery or pickup?”.</li>
              <li><b className="text-white">3. Book & track</b> — order in one tap, WhatsApp the vendor, track to doorstep.</li>
            </ol>
            <Link href="/auth?mode=signup" className="mt-5 inline-block rounded-2xl bg-white px-5 py-3 text-[14px] font-bold text-green-900">Create free account →</Link>
            <p className="mt-3 text-[12px] text-white/60">Demo customer: customer@zapkart.demo / customer123</p>
          </div>
          <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-600">For vendors</p>
            <h3 className="mt-2 text-[24px] font-black">Your shop, live in 2 minutes.</h3>
            <ol className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-gray-600">
              <li><b>1. Upload DP + shop name</b> — toggle open/close with next opening/closing time.</li>
              <li><b>2. Add inventory live</b> — picture, price, weight, available/OOS toggle, delete in one tap.</li>
              <li><b>3. List facilities + 60-sec video ads</b> — extra services with price; video charged per season & demand.</li>
            </ol>
            <Link href="/auth?mode=signup&role=vendor" className="mt-5 inline-block rounded-2xl bg-purple-700 px-5 py-3 text-[14px] font-bold text-white shadow-lg shadow-purple-700/30">Start selling →</Link>
            <p className="mt-3 text-[12px] text-gray-500">Demo vendor: vendor1@zapkart.demo / vendor123</p>
          </div>
        </section>

        <footer className="rounded-3xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-[14px] font-black">ZapKart Live Bazaar 🛒</p>
          <p className="mx-auto mt-1 max-w-xl text-[12.5px] text-gray-500">Built for vendors & customers collaborating — live inventory, bargaining chat, pickup/delivery, WhatsApp ordering, facilities & seasonal video ads.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[12px] font-bold">
            <Link href="/auth" className="rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200">Login</Link>
            <Link href="/vendor" className="rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200">Vendor dashboard</Link>
            <Link href="/account" className="rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200">My orders</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
