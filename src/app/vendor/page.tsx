"use client";

import Link from "next/link";
import { ArrowRight, Megaphone, Receipt, MessageCircle, Boxes, Sparkles, Clock } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useVendorGate } from "@/components/vendor/useVendorData";
import { StatusToggle } from "@/components/vendor/StatusToggle";
import { Badge, Button, EmptyState, Glass, Skeleton, VisitStoreButton } from "@/components/ui";
import { money } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/order-status";
import { formatDateTimeIst } from "@/lib/time";

type Overview = {
  store: import("@/components/AuthProvider").VendorStore;
  stats: { newBookings: number; todaySales: number; todayOrders: number; unreadChats: number };
  recentOrders: { id: string; customerName: string; fulfillment: string; status: string; total: number; createdAt: string }[];
  inventory: { total: number; inStock: number; low: number; outOfStock: number };
  ad: { id: string; title: string; endsAt: string; status: string } | null;
  market: { activeCampaigns: number; demandMultiplier: number; season: string; seasonMultiplier: number };
};

export default function VendorOverview() {
  const gate = useVendorGate();
  const { data, loading } = useApi<Overview>(gate.ready ? "/api/vendor/overview" : null, { poll: 8000 });

  if (!gate.ready || (loading && !data)) {
    return <div className="space-y-5"><Skeleton className="h-32" /><div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-64" /></div>;
  }
  if (!data) return <Glass><EmptyState title="Couldn't load your dashboard" body="Check your connection and refresh." /></Glass>;

  const { stats, inventory } = data;
  const tiles = [
    { label: "New bookings", value: String(stats.newBookings), href: "/vendor/bookings", icon: Receipt, tone: "text-amber-700" },
    { label: "Today's sales", value: money(stats.todaySales), href: "/vendor/bookings", icon: Sparkles, tone: "text-emerald-700" },
    { label: "Today's bookings", value: String(stats.todayOrders), href: "/vendor/bookings", icon: Clock, tone: "text-sky-700" },
    { label: "Unread chats", value: String(stats.unreadChats), href: "/vendor/chats", icon: MessageCircle, tone: "text-violet-700" },
  ];
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-ink/55">{greet}</p>
          <h1 className="text-[28px] font-black tracking-tight">{data.store.shopName}</h1>
        </div>
        <VisitStoreButton storeId={data.store.id} label="Visit my store" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <StatusToggle store={data.store} big />
        <Glass className="flex flex-col justify-between gap-4 p-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink/50">Market today</p>
            <p className="mt-1 text-[17px] font-black">{data.market.season}</p>
            <p className="text-[12.5px] text-ink/60">Demand ×{data.market.demandMultiplier.toFixed(2)} · {data.market.activeCampaigns} ads running across NCR</p>
          </div>
          {data.ad ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50/80 p-3">
              <div className="min-w-0"><p className="truncate text-[13.5px] font-bold">{data.ad.title}</p><p className="text-[12px] text-ink/60">Live until {formatDateTimeIst(data.ad.endsAt)}</p></div>
              <Badge tone="green">Live</Badge>
            </div>
          ) : (
            <Link href="/vendor/ads"><Button variant="gold" size="sm"><Megaphone className="h-3.5 w-3.5" /> Promote your shop</Button></Link>
          )}
        </Glass>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Glass className="rise h-full p-5 transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between"><t.icon className={`h-5 w-5 ${t.tone}`} /><ArrowRight className="h-4 w-4 text-ink/30" /></div>
              <p className="mt-4 text-[26px] font-black tabular-nums tracking-tight">{t.value}</p>
              <p className="text-[12.5px] font-semibold text-ink/55">{t.label}</p>
            </Glass>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Glass className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-[15px] font-extrabold"><Boxes className="h-4 w-4" /> Inventory</p>
            <Link href="/vendor/inventory" className="text-[12.5px] font-bold text-ink/60 hover:text-ink">Manage</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Listed" value={inventory.total} />
            <Stat label="In stock" value={inventory.inStock} tone="text-emerald-700" />
            <Stat label="Out" value={inventory.outOfStock} tone="text-red-700" />
          </div>
          {inventory.low > 0 && <p className="mt-4 rounded-2xl bg-amber-50/90 px-3 py-2 text-[12.5px] font-semibold text-amber-900">{inventory.low} items are running low.</p>}
        </Glass>

        <Glass className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[15px] font-extrabold">Latest bookings</p>
            <Link href="/vendor/bookings" className="text-[12.5px] font-bold text-ink/60 hover:text-ink">All bookings</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <EmptyState title="No bookings yet" body="Bookings appear here the moment a customer places one." />
          ) : (
            <ul className="divide-y divide-ink/5">
              {data.recentOrders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold">{o.customerName}</p>
                    <p className="text-[12px] text-ink/50">{o.fulfillment === "delivery" ? "Delivery" : "Pickup"} · {formatDateTimeIst(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black tabular-nums">{money(o.total)}</p>
                    <p className="text-[11.5px] font-bold text-ink/60">{STATUS_LABEL[o.status] ?? o.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Glass>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white/50 p-3">
      <p className={`text-[22px] font-black tabular-nums ${tone}`}>{value}</p>
      <p className="text-[11.5px] font-semibold text-ink/55">{label}</p>
    </div>
  );
}
