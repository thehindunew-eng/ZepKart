"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { inr, timeAgo } from "@/lib/utils";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [tab, setTab] = useState<"orders" | "chats">("orders");

  useEffect(() => {
    if (!loading && !user) router.push("/auth?next=/account");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBusy(true);
      const [o, t] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/threads?mine=1", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setOrders(o.orders ?? []);
      setThreads(t.threads ?? []);
      setBusy(false);
    })();
  }, [user?.id]);

  const cancel = async (id: string) => {
    if (!confirm("Cancel this order?")) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
  };

  if (loading) {
    return (
      <div className="min-h-screen"><Header /><div className="mx-auto max-w-4xl px-4 py-10"><Skeleton className="h-64" /></div></div>
    );
  }
  if (!user) return null;

  if (user.role === "vendor") {
    router.push("/vendor");
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-4 rounded-3xl bg-neutral-950 p-6 text-white">
          <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white/15 text-xl font-black">
            {user.avatarUrl ? <img src={user.avatarUrl} className="h-full w-full object-cover" alt="" /> : user.name[0]}
          </span>
          <div>
            <h1 className="text-[20px] font-black">Hi, {user.name} 👋</h1>
            <p className="text-[13px] text-white/60">{user.email} · {orders.length} bookings</p>
          </div>
          <Link href="/" className="ml-auto rounded-2xl bg-white px-4 py-2.5 text-[13px] font-black text-neutral-950">+ Shop more</Link>
        </div>

        <div className="mt-4 flex gap-2 rounded-2xl border border-gray-200 bg-white p-1.5">
          {(["orders", "chats"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-xl py-2.5 text-[13.5px] font-black capitalize ${tab === t ? "bg-neutral-900 text-white" : "text-gray-500"}`}>
              {t === "orders" ? `🧾 My bookings (${orders.length})` : `💬 My chats (${threads.length})`}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {busy ? <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
            : tab === "orders" ? (
              orders.length === 0 ? <EmptyState title="No bookings yet" hint="Order anything — pickup or delivery — and track it here live." action={<Link href="/" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white">Browse bazaar →</Link>} />
              : (
                <div className="space-y-2.5">
                  {orders.map((o: any) => (
                    <div key={o.id} className="rounded-3xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <img src={o.product?.imageUrl ?? "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=60"} className="h-14 w-14 rounded-2xl object-cover" alt="" />
                        <div className="min-w-0">
                          <p className="truncate text-[14.5px] font-black">{o.product?.name ?? o.facility?.title ?? "Order"} × {o.qty}</p>
                          <p className="text-[12px] text-gray-500">{o.store?.shopName} · {o.fulfillment} · {timeAgo(o.createdAt)}</p>
                        </div>
                        <span className="ml-auto text-[15px] font-black">{inr(o.total)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={o.status === "delivered" ? "green" : o.status === "cancelled" ? "red" : "black"}>{o.status.replace("_", " ")}</Badge>
                        <Badge tone={o.fulfillment === "delivery" ? "green" : "blue"}>{o.fulfillment === "delivery" ? "🛵 delivery" : "🏃 pickup"}</Badge>
                        <span className="ml-auto flex gap-2">
                          {o.store && <Link href={`/stores/${o.storeId}`} className="rounded-xl bg-gray-100 px-3 py-1.5 text-[12px] font-black">Store →</Link>}
                          {o.productId && <Link href={`/products/${o.productId}`} className="rounded-xl bg-gray-100 px-3 py-1.5 text-[12px] font-black">Reorder / chat →</Link>}
                          {o.status === "pending" && <button onClick={() => cancel(o.id)} className="rounded-xl bg-red-50 px-3 py-1.5 text-[12px] font-black text-red-700">Cancel</button>}
                        </span>
                      </div>
                      {/* progress */}
                      <div className="mt-3 flex items-center gap-1">
                        {["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered"].map((s, i, arr) => {
                          const idx = arr.indexOf(o.status);
                          const done = i <= idx && o.status !== "cancelled";
                          return <span key={s} className={`h-1.5 flex-1 rounded-full ${done ? "bg-green-600" : "bg-gray-200"}`} title={s} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              threads.length === 0 ? <EmptyState title="No chats yet" hint="Tap 'Bargain in chat' on any product to negotiate price or ask for delivery." />
              : (
                <div className="space-y-2.5">
                  {threads.map((t: any) => (
                    <Link key={t.id} href={t.productId ? `/products/${t.productId}` : `/stores/${t.storeId}`} className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-white p-4 hover:shadow-md">
                      <img src={t.product?.imageUrl ?? t.store?.dpUrl ?? ""} className="h-12 w-12 rounded-2xl object-cover" alt="" />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-black">{t.product?.name ?? t.store?.shopName}</span>
                        <span className="block truncate text-[12px] text-gray-500">{t.preview || `${t.type} · ${t.fulfillment}`}</span>
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        {t.offerPrice && <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-black text-green-800">{inr(t.offerPrice)}</span>}
                        <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-black text-white">{t.status}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}
