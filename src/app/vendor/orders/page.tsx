"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmptyState, Skeleton } from "@/components/ui";
import { inr, timeAgo, waLink } from "@/lib/utils";

const STATUSES = ["All", "pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
const NEXT: Record<string, string | null> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  cancelled: null,
};

export default function VendorOrders() {
  const { store } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [fulfill, setFulfill] = useState("All");

  const load = async () => {
    if (!store) return;
    setLoading(true);
    const r = await fetch(`/api/orders?storeId=${store.id}`, { cache: "no-store" }).then((x) => x.json());
    setOrders(r.orders ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const filtered = useMemo(() => {
    let r = orders;
    if (filter !== "All") r = r.filter((o) => o.status === filter);
    if (fulfill !== "All") r = r.filter((o) => o.fulfillment === fulfill);
    return r;
  }, [orders, filter, fulfill]);

  const advance = async (o: any, status: string) => {
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x))); // optimistic
    await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-black">🧾 Orders</h1>
          <p className="text-[13px] text-gray-500">Pickup & delivery bookings — advance status, WhatsApp the customer. Auto-refreshes.</p>
        </div>
        <span className="ml-auto rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-bold">{filtered.length} shown</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold capitalize ${filter === s ? "bg-neutral-900 text-white" : "bg-white border border-gray-200"}`}>{s.replace("_", " ")}</button>
        ))}
        <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />
        {["All", "delivery", "pickup"].map((f) => (
          <button key={f} onClick={() => setFulfill(f)} className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold capitalize ${fulfill === f ? "bg-green-700 text-white" : "bg-white border border-gray-200"}`}>{f === "All" ? "Both modes" : f === "delivery" ? "🛵 Delivery" : "🏃 Pickup"}</button>
        ))}
      </div>

      {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        : filtered.length === 0 ? <EmptyState title="No orders here" hint="Share your store link — orders appear live with customer phone & address." />
        : (
          <div className="space-y-2.5">
            {filtered.map((o) => (
              <div key={o.id} className="rounded-3xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <img src={o.product?.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=60"} className="h-14 w-14 rounded-2xl object-cover" alt="" />
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-black">{o.product?.name ?? o.facility?.title ?? "Order"} <span className="text-gray-400">× {o.qty}</span></p>
                    <p className="text-[12px] text-gray-500">{o.customerName} · {o.phone} · {timeAgo(o.createdAt)}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-black uppercase">{o.fulfillment === "delivery" ? "🛵 delivery" : "🏃 pickup"}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${o.status === "delivered" ? "bg-green-100 text-green-800" : o.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-neutral-900 text-white"}`}>{o.status.replace("_", " ")}</span>
                    <span className="text-[15px] font-black">{inr(o.total)}</span>
                  </div>
                </div>
                {(o.address || o.note) && <p className="mt-2 rounded-2xl bg-gray-50 px-3 py-2 text-[12.5px] text-gray-600">📍 {o.address}{o.note ? ` · “${o.note}”` : ""}</p>}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {NEXT[o.status] && (
                    <button onClick={() => advance(o, NEXT[o.status]!)} className="rounded-xl bg-green-700 px-4 py-2 text-[12.5px] font-black text-white hover:bg-green-800">
                      Mark {NEXT[o.status]!.replace("_", " ")} →
                    </button>
                  )}
                  {o.status !== "cancelled" && o.status !== "delivered" && (
                    <button onClick={() => advance(o, "cancelled")} className="rounded-xl bg-red-50 px-4 py-2 text-[12.5px] font-black text-red-700">Cancel</button>
                  )}
                  {o.phone && <a href={waLink(o.phone, `Hi ${o.customerName}! This is ${store?.shopName} — your order (${o.product?.name ?? ""} × ${o.qty}) is ${o.status}.`)} target="_blank" className="rounded-xl bg-[#25D366]/15 px-4 py-2 text-[12.5px] font-black text-green-800">💬 WhatsApp customer</a>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
