"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui";
import { inr, timeAgo } from "@/lib/utils";

export default function VendorOverview() {
  const { store, refresh } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    (async () => {
      setLoading(true);
      const [p, o, t, f, v] = await Promise.all([
        fetch(`/api/products?storeId=${store.id}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/orders?storeId=${store.id}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/threads?storeId=${store.id}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/facilities?storeId=${store.id}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/promos?storeId=${store.id}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setStats({ products: p.products ?? [], orders: o.orders ?? [], threads: t.threads ?? [], facilities: f.facilities ?? [], promos: v.promos ?? [] });
      setLoading(false);
    })();
  }, [store?.id]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!store) return <div className="rounded-3xl border bg-white p-8 text-center text-sm text-gray-500">Loading your store…</div>;

  const products = stats?.products ?? [];
  const orders = stats?.orders ?? [];
  const available = products.filter((p: any) => p.status !== "oos").length;
  const oos = products.filter((p: any) => p.status === "oos").length;
  const low = products.filter((p: any) => p.status !== "oos" && p.stockQty < 15);
  const pending = orders.filter((o: any) => ["pending", "accepted", "preparing"].includes(o.status));
  const revenue = orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);

  const cards = [
    ["📦 Live items", String(products.length), `${available} available · ${oos} OOS`, "/vendor/inventory", "bg-green-700"],
    ["🧾 Active orders", String(pending.length), `${orders.length} total · ${inr(revenue)} revenue`, "/vendor/orders", "bg-neutral-900"],
    ["💬 Open chats", String((stats?.threads ?? []).filter((t: any) => t.status === "open").length), "bargain + delivery threads", "/vendor/chats", "bg-blue-700"],
    ["✨ Facilities / Ads", `${(stats?.facilities ?? []).length} / ${(stats?.promos ?? []).length}`, "extras + video promos", "/vendor/facilities", "bg-purple-700"],
  ];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl bg-neutral-950 p-6 text-white sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-300">{store.isOpen ? "● Live now" : "○ Currently closed"} · {store.city}</p>
            <h1 className="mt-1 text-[24px] font-black sm:text-[28px]">Namaste, {store.shopName} 👋</h1>
            <p className="mt-1 text-[13px] text-white/65">{store.isOpen ? store.nextClosingAt : store.nextOpeningAt} · 🛵 {store.deliveryAvailable ? "Delivery on" : "Delivery off"} · 🏃 {store.pickupAvailable ? "Pickup on" : "Pickup off"}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link href="/vendor/inventory" className="rounded-2xl bg-lime-400 px-4 py-2.5 text-[13px] font-black text-neutral-950 hover:bg-lime-300">+ Add item</Link>
            <Link href={`/stores/${store.id}`} className="rounded-2xl bg-white/10 px-4 py-2.5 text-[13px] font-black hover:bg-white/20">View storefront</Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, n, sub, href, bg]) => (
            <Link key={label as string} href={href as string} className="rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <p className="text-[12px] font-black uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-1 text-[30px] font-black">{n}</p>
              <p className="text-[12px] font-bold text-gray-500">{sub}</p>
              <span className={`mt-3 inline-block rounded-xl ${bg} px-3 py-1.5 text-[12px] font-black text-white`}>Open →</span>
            </Link>
          ))}
        </div>
      )}

      {!loading && low.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[14px] font-black text-amber-900">⚠️ Low stock — update before it goes OOS</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {low.slice(0, 6).map((p: any) => (
              <Link key={p.id} href="/vendor/inventory" className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-amber-900 ring-1 ring-amber-200">{p.name} · {p.stockQty} left</Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-black">🧾 Latest orders</p>
            <Link href="/vendor/orders" className="text-[12px] font-bold text-green-700">View all →</Link>
          </div>
          <div className="mt-3 space-y-2">
            {(orders.slice(0, 4) as any[]).map((o: any) => (
              <div key={o.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg">🧺</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold">{o.product?.name ?? o.facility?.title ?? "Order"} × {o.qty}</span>
                  <span className="block text-[11px] text-gray-500">{o.customerName} · {o.fulfillment} · {timeAgo(o.createdAt)}</span>
                </span>
                <span className="ml-auto rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-black text-white">{o.status}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="py-6 text-center text-[13px] text-gray-400">No orders yet — share your store link on WhatsApp 📲</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-black">💬 Latest chats</p>
            <Link href="/vendor/chats" className="text-[12px] font-bold text-green-700">Reply →</Link>
          </div>
          <div className="mt-3 space-y-2">
            {((stats?.threads ?? []).slice(0, 4) as any[]).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-100 text-lg">💬</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold">{t.customer?.name} · {t.product?.name ?? t.type}</span>
                  <span className="block truncate text-[11px] text-gray-500">{t.preview}</span>
                </span>
                {t.offerPrice && <span className="ml-auto rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-black text-green-800">{inr(t.offerPrice)}</span>}
              </div>
            ))}
            {(stats?.threads ?? []).length === 0 && <p className="py-6 text-center text-[13px] text-gray-400">No chats yet — customers bargain under each item.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["📸 Update DP & timings", "Open/close, next slot, WhatsApp number", "/vendor/settings"],
          ["✨ Add a facility", "Atta grinding, delivery, subscription…", "/vendor/facilities"],
          ["▶ Boost with video", "60-sec ad charged per season", "/vendor/promos"],
        ].map(([t, d, h]) => (
          <Link key={t as string} href={h as string} className="rounded-3xl border border-dashed border-gray-300 bg-white p-5 hover:border-green-600 hover:bg-green-50/50">
            <p className="text-[14px] font-black">{t}</p>
            <p className="mt-1 text-[12.5px] text-gray-500">{d}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
