"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Badge, EmptyState, OpenBadge, Skeleton, btnPrimary, btnGhost } from "@/components/ui";
import { ChatPanel } from "@/components/ChatPanel";
import { ProductCard } from "@/components/cards";
import { inr, waLink } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [ordering, setOrdering] = useState(false);
  const [msg, setMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/products/${id}`, { cache: "no-store" });
    const j = await r.json();
    setData(j);
    if (j.product?.storeId) {
      const rr = await fetch(`/api/products?storeId=${j.product.storeId}`, { cache: "no-store" }).then((x) => x.json());
      setRelated((rr.products ?? []).filter((p: any) => p.id !== id).slice(0, 5));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const order = async () => {
    if (!user) {
      window.location.href = `/auth?next=/products/${id}`;
      return;
    }
    setOrdering(true);
    setMsg("");
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: data.product.storeId,
        productId: data.product.id,
        qty,
        fulfillment,
        phone: phone || user.phone,
        address: fulfillment === "delivery" ? address || "Home address (edit me)" : "Pickup from store",
        note: `${qty} × ${data.product.weight}`,
      }),
    });
    const j = await r.json();
    setOrdering(false);
    if (!r.ok) setMsg(j.error || "Order failed");
    else {
      setMsg(`✅ Booked! Order ${j.order.id.slice(0, 8)}… — ${fulfillment === "delivery" ? "rider will be assigned" : "show this at counter"}. Track in My Orders.`);
      load();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen"><Header />
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      </div>
    );
  }
  if (!data?.product) {
    return (
      <div className="min-h-screen"><Header />
        <div className="mx-auto max-w-xl px-4 py-16"><EmptyState title="Item not found" hint="It may have been deleted by the vendor." action={<Link href="/" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white">Back to bazaar</Link>} /></div>
      </div>
    );
  }
  const p = data.product;
  const s = data.store;
  const oos = p.status === "oos" || p.stockQty <= 0;
  const off = p.mrp && Number(p.mrp) > Number(p.price) ? Math.round((1 - Number(p.price) / Number(p.mrp)) * 100) : 0;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link href={s ? `/stores/${s.id}` : "/"} className="text-[13px] font-bold text-gray-500 hover:text-gray-900">← {s ? s.shopName : "Back"}</Link>
        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* image */}
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="relative">
              <img src={p.imageUrl} alt={p.name} className={`aspect-[4/3] w-full object-cover ${oos ? "grayscale" : ""}`} />
              {off > 0 && !oos && <span className="absolute left-4 top-4 rounded-xl bg-green-700 px-3 py-1.5 text-[13px] font-black text-white">{off}% OFF</span>}
              {oos && <span className="absolute inset-0 grid place-items-center bg-white/50"><span className="rounded-2xl bg-neutral-900 px-4 py-2 text-[13px] font-black uppercase text-white">Out of stock · ask vendor</span></span>}
            </div>
            <div className="flex gap-2 overflow-x-auto p-4 no-scrollbar">
              {[p.imageUrl, s?.dpUrl].filter(Boolean).map((u: string, i: number) => (
                <img key={i} src={u} className="h-16 w-16 shrink-0 rounded-2xl border border-gray-200 object-cover" alt="" />
              ))}
              <div className="grid h-16 shrink-0 place-items-center rounded-2xl bg-gray-50 px-4 text-[12px] font-bold text-gray-500">📷 {p.weight} pack</div>
            </div>
          </div>

          {/* info */}
          <div>
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              {s && <Link href={`/stores/${s.id}`} className="text-[12px] font-black uppercase tracking-wide text-green-700 hover:underline">🏪 {s.shopName} · {s.city}</Link>}
              <h1 className="mt-1 text-[28px] font-black leading-tight">{p.name}</h1>
              <p className="mt-1 text-[14px] text-gray-500">{p.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={oos ? "red" : "green"}>{oos ? "● OOS — live" : `● In stock · ${p.stockQty} left`}</Badge>
                <Badge tone="gray">{p.weight}</Badge>
                <Badge tone="purple">{p.category}</Badge>
                {s && <OpenBadge isOpen={s.isOpen} nextOpeningAt={s.nextOpeningAt} nextClosingAt={s.nextClosingAt} />}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[34px] font-black">{inr(p.price)}</span>
                {p.mrp && Number(p.mrp) > Number(p.price) && <span className="text-[16px] font-bold text-gray-400 line-through">{inr(p.mrp)}</span>}
                <span className="text-[12px] font-bold text-gray-400">/ {p.weight}</span>
              </div>

              {/* fulfillment */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5">
                {(s?.deliveryAvailable !== false) && (
                  <button onClick={() => setFulfillment("delivery")} className={`rounded-xl py-2.5 text-[13.5px] font-black ${fulfillment === "delivery" ? "bg-white shadow" : "text-gray-500"}`}>🛵 Delivery {s ? inr(s.deliveryFee) : ""}</button>
                )}
                {(s?.pickupAvailable !== false) && (
                  <button onClick={() => setFulfillment("pickup")} className={`rounded-xl py-2.5 text-[13.5px] font-black ${fulfillment === "pickup" ? "bg-white shadow" : "text-gray-500"}`}>🏃 Pickup free</button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-2xl border border-gray-200 p-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100 text-lg font-black">−</button>
                  <span className="w-10 text-center text-[15px] font-black">{qty}</span>
                  <button onClick={() => setQty(Math.min(20, qty + 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-900 text-lg font-black text-white">+</button>
                </div>
                <span className="text-[13px] font-bold text-gray-500">Total ~ <b className="text-gray-900">{inr(Number(p.price) * qty + (fulfillment === "delivery" && s ? Number(s.deliveryFee) : 0))}</b>{fulfillment === "delivery" ? " incl. delivery" : ""}</span>
              </div>

              {fulfillment === "delivery" && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone for rider" className="rounded-xl border border-gray-200 px-3 py-2.5 text-[13.5px] outline-none focus:border-green-600" />
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" className="rounded-xl border border-gray-200 px-3 py-2.5 text-[13.5px] outline-none focus:border-green-600" />
                </div>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button onClick={order} disabled={ordering || oos} className={btnPrimary + " !py-3.5"}>
                  {oos ? "Out of stock" : ordering ? "Booking…" : fulfillment === "delivery" ? "🛵 Book delivery" : "🏃 Book pickup"}
                </button>
                {s && <a href={waLink(s.whatsapp, `Hi ${s.shopName}! I want ${qty} × ${p.name} (${p.weight}) at ${inr(p.price)} — ${fulfillment}. From ZapKart.`)} target="_blank" className={btnGhost + " !py-3.5 !border-green-600 !text-green-800"}>💬 WhatsApp vendor</a>}
              </div>
              {msg && <p className={`mt-3 rounded-2xl px-4 py-3 text-[13px] font-bold ${msg.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg} {msg.startsWith("✅") && <Link href="/account" className="underline">Track →</Link>}</p>}
              <p className="mt-3 text-[12px] leading-relaxed text-gray-500">💡 Price too high? <b>Offer your price in the chat below</b> — vendors often accept for bulk or pickup. {oos && "This item is OOS but you can still ask when it returns."}</p>
            </div>

            {s && (
              <Link href={`/stores/${s.id}`} className="mt-3 flex items-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 hover:shadow-md">
                <img src={s.dpUrl} className="h-12 w-12 rounded-2xl object-cover" alt="" />
                <span>
                  <span className="block text-[14px] font-black">{s.shopName}</span>
                  <span className="block text-[12px] text-gray-500">{s.isOpen ? `Open · ${s.nextClosingAt}` : `Closed · ${s.nextOpeningAt}`} · 📞 {s.phone}</span>
                </span>
                <span className="ml-auto text-[13px] font-black">Visit store →</span>
              </Link>
            )}
          </div>
        </div>

        {/* chat */}
        <div className="mx-auto mt-6 max-w-3xl">
          <h2 className="mb-3 text-[18px] font-black">🤝 Bargain & delivery chat — dedicated to this item</h2>
          {s && <ChatPanel productId={p.id} storeId={p.storeId} price={Number(p.price)} />}
        </div>

        {/* related */}
        {related.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-3 text-[18px] font-black">More from {s?.shopName}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {related.map((r: any) => <ProductCard key={r.id} p={{ ...r, store: s }} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
