"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Footprints, Truck, X, Check, Store } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Glass, Skeleton } from "@/components/ui";
import { money, cn } from "@/lib/utils";
import { formatDateTimeIst } from "@/lib/time";
import { STATUS_LABEL, progressSteps } from "@/lib/order-status";
import { TrackButton } from "@/components/TrackPanel";

type OrderRow = {
  id: string;
  storeId: string;
  store: { id: string; shopName: string; whatsapp: string | null; locality: string | null; city: string } | null;
  fulfillment: "pickup" | "delivery";
  address: string | null;
  status: string;
  total: number;
  gstAmount: number;
  deliveryFee: number;
  rejectReason: string | null;
  createdAt: string;
  items: { id: string; name: string; qty: number; lineTotal: number; agreed: boolean }[];
  services: { id: string; title: string; qty: number; lineTotal: number }[];
};

const STEP_LABEL: Record<string, string> = { new: "Booked", accepted: "Accepted", preparing: "Preparing", ready: "Ready", out_for_delivery: "On the way", completed: "Done" };

function Timeline({ o }: { o: OrderRow }) {
  const steps = progressSteps(o.fulfillment);
  const idx = steps.indexOf(o.status);
  return (
    <ol className="grid grid-cols-5 gap-1.5">
      {steps.map((s, i) => {
        const done = idx >= i;
        return (
          <li key={s} className="space-y-1.5">
            <div className={cn("h-1.5 rounded-full transition-colors duration-500", done ? "bg-gradient-to-r from-emerald-500 to-emerald-700" : "bg-ink/10")} />
            <p className={cn("truncate text-[10.5px] font-bold sm:text-[11.5px]", done ? "text-ink" : "text-ink/40")}>{STEP_LABEL[s] ?? s}</p>
          </li>
        );
      })}
    </ol>
  );
}

function OrdersInner() {
  const params = useSearchParams();
  const placed = params.get("placed");
  const { user, loading: authLoading } = useAuth();
  const { data, loading, reload } = useApi<{ orders: OrderRow[] }>(user ? "/api/orders" : null, { poll: 6000 });
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const cancel = async (id: string) => {
    setBusy(id);
    try {
      await api(`/api/orders/${id}`, { method: "PATCH", json: { action: "cancel" } });
      toast("Booking cancelled. Stock has been released.");
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  if (authLoading) return <Skeleton className="h-96" />;
  if (!user) {
    return <Glass><EmptyState icon={<Package className="h-6 w-6" />} title="Log in to see your bookings" action={<Link href="/auth?next=/orders"><Button>Log in</Button></Link>} /></Glass>;
  }
  if (user.role === "vendor") {
    return <Glass><EmptyState title="Your bookings live in the vendor dashboard" action={<Link href="/vendor/bookings"><Button>Open bookings</Button></Link>} /></Glass>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-black tracking-tight">My bookings</h1>
        <p className="text-[14px] text-ink/55">Live status for every pickup and delivery.</p>
      </div>

      {loading && !data ? (
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-52" />)}</div>
      ) : (data?.orders.length ?? 0) === 0 ? (
        <Glass><EmptyState icon={<Package className="h-6 w-6" />} title="No bookings yet" body="Your pickups and deliveries will show up here." action={<Link href="/"><Button>Find something fresh</Button></Link>} /></Glass>
      ) : (
        <div className="space-y-4">
          {data!.orders.map((o) => {
            const rejected = o.status === "rejected" || o.status === "cancelled";
            return (
              <Glass key={o.id} className={cn("rise space-y-4 p-5 sm:p-6", placed === o.id && "ring-2 ring-emerald-500/60")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[16px] font-extrabold"><Store className="h-4 w-4 text-ink/50" /> {o.store?.shopName ?? "Store"}</p>
                    <p className="text-[12.5px] text-ink/55">#{o.id.slice(0, 8).toUpperCase()} · {formatDateTimeIst(o.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={rejected ? "red" : o.status === "completed" ? "green" : "dark"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                    <Badge tone="gray">{o.fulfillment === "delivery" ? <><Truck className="h-3 w-3" /> Delivery</> : <><Footprints className="h-3 w-3" /> Pickup</>}</Badge>
                  </div>
                </div>

                {!rejected && <Timeline o={o} />}
                {o.status === "rejected" && <p className="rounded-2xl bg-red-50/80 px-4 py-3 text-[13.5px] font-semibold text-red-800">The store couldn&apos;t take this booking{o.rejectReason ? `: ${o.rejectReason}` : "."}</p>}

                <div className="rounded-2xl bg-white/50 p-4 text-[13.5px]">
                  <ul className="space-y-1.5">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-3"><span>{i.qty} × {i.name}{i.agreed && <span className="ml-1.5 text-[11px] font-bold text-emerald-700">agreed</span>}</span><span className="tabular-nums">{money(i.lineTotal)}</span></li>
                    ))}
                    {o.services.map((s) => (
                      <li key={s.id} className="flex justify-between gap-3"><span>{s.qty} × {s.title}</span><span className="tabular-nums">{money(s.lineTotal)}</span></li>
                    ))}
                  </ul>
                  <div className="my-3 h-px bg-ink/10" />
                  <div className="flex justify-between font-black"><span>Total</span><span className="tabular-nums">{money(o.total)}</span></div>
                  <p className="mt-0.5 text-[11.5px] text-ink/50">Includes GST {money(o.gstAmount)}{o.deliveryFee > 0 ? ` · delivery ${money(o.deliveryFee)}` : ""}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!rejected && o.status !== "completed" && <TrackButton orderId={o.id} status={o.status} fulfillment={o.fulfillment} storeName={o.store?.shopName} />}
                  {o.status === "new" && <Button variant="danger" size="sm" disabled={busy === o.id} onClick={() => cancel(o.id)}><X className="h-3.5 w-3.5" /> Cancel booking</Button>}
                  {o.store && <Link href={`/stores/${o.store.id}`}><Button variant="soft" size="sm"><Store className="h-3.5 w-3.5" /> Visit store</Button></Link>}
                  {o.status === "completed" && <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Thank you for shopping local</span>}
                </div>
              </Glass>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <OrdersInner />
    </Suspense>
  );
}
