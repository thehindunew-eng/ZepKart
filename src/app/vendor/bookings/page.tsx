"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MapPin, StickyNote, Footprints, Truck, Check, X, ChefHat, Package } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { useVendorGate } from "@/components/vendor/useVendorData";
import { Badge, Button, EmptyState, Glass, Modal, Skeleton, Field } from "@/components/ui";
import { money, cn } from "@/lib/utils";
import { formatDateTimeIst } from "@/lib/time";
import { NEXT_STATUS, STATUS_LABEL, progressSteps } from "@/lib/order-status";

type Order = {
  id: string;
  customerName: string;
  phone: string;
  fulfillment: "pickup" | "delivery";
  address: string | null;
  pincode: string | null;
  note: string | null;
  status: string;
  total: number;
  gstAmount: number;
  deliveryFee: number;
  createdAt: string;
  items: { id: string; name: string; qty: number; lineTotal: number; agreed: boolean }[];
  services: { id: string; title: string; qty: number; lineTotal: number }[];
};

const TABS = {
  new: { label: "New", statuses: ["new"] },
  active: { label: "In progress", statuses: ["accepted", "preparing", "ready", "out_for_delivery"] },
  done: { label: "Done", statuses: ["completed", "rejected", "cancelled"] },
} as const;

const ACTION_ICON: Record<string, React.ComponentType<{ className?: string }>> = { accept: Check, preparing: ChefHat, ready: Package, out_for_delivery: Truck, complete: Check, reject: X };

export default function BookingsPage() {
  const gate = useVendorGate();
  const { data, setData, loading, reload } = useApi<{ orders: Order[] }>(gate.ready ? "/api/orders" : null, { poll: 5000 });
  const { toast } = useToast();
  const [tab, setTab] = useState<keyof typeof TABS>("new");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const seen = useRef<Set<string> | null>(null);

  // Let the vendor know about bookings that arrive while the page is open.
  useEffect(() => {
    if (!data) return;
    if (!seen.current) {
      seen.current = new Set(data.orders.map((o) => o.id));
      return;
    }
    const fresh = data.orders.filter((o) => !seen.current!.has(o.id));
    fresh.forEach((o) => seen.current!.add(o.id));
    if (fresh.length) toast(`New booking from ${fresh[0].customerName}`);
  }, [data, toast]);

  const orders = data?.orders ?? [];
  const shown = orders.filter((o) => (TABS[tab].statuses as readonly string[]).includes(o.status));
  const counts = { new: orders.filter((o) => o.status === "new").length };

  /** Accept, prepare, ready, deliver, complete. The status changes at once and rolls back on error. */
  const act = async (o: Order, action: string, extra: Record<string, unknown> = {}) => {
    const step = (NEXT_STATUS[o.status] ?? []).find((s) => s.action === action);
    const nextStatus = action === "reject" ? "rejected" : step?.to ?? o.status;
    setBusy(o.id);
    setData((d) => (d ? { orders: d.orders.map((x) => (x.id === o.id ? { ...x, status: nextStatus } : x)) } : d));
    try {
      await api(`/api/orders/${o.id}`, { method: "PATCH", json: { action, ...extra } });
      toast(action === "reject" ? "Booking declined. Stock returned to shelf." : `Booking moved to ${STATUS_LABEL[nextStatus] ?? nextStatus}`);
      await reload();
    } catch (e) {
      setData((d) => (d ? { orders: d.orders.map((x) => (x.id === o.id ? { ...x, status: o.status } : x)) } : d));
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  if (!gate.ready) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-black tracking-tight">Bookings</h1>
          <p className="text-[14px] text-ink/55">Accept, prepare and hand over pickups and deliveries.</p>
        </div>
        <div className="glass-pill flex rounded-full p-1 text-[12.5px] font-bold">
          {(Object.keys(TABS) as (keyof typeof TABS)[]).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition", tab === k ? "bg-ink text-white" : "text-ink/65")}>
              {TABS[k].label}
              {k === "new" && counts.new > 0 && <span className="rounded-full bg-amber-400 px-1.5 text-[10.5px] font-black text-amber-950">{counts.new}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : shown.length === 0 ? (
        <Glass><EmptyState icon={<Package className="h-6 w-6" />} title={tab === "new" ? "No new bookings" : tab === "active" ? "Nothing in progress" : "No finished bookings yet"} body={tab === "new" ? "New bookings will appear here and ring a toast." : undefined} /></Glass>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {shown.map((o) => {
            const actions = NEXT_STATUS[o.status] ?? [];
            const steps = progressSteps(o.fulfillment);
            const idx = steps.indexOf(o.status);
            const closed = o.status === "rejected" || o.status === "cancelled";
            return (
              <Glass key={o.id} className="rise flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-extrabold">{o.customerName}</p>
                    <p className="text-[12.5px] text-ink/55">#{o.id.slice(0, 8).toUpperCase()} · {formatDateTimeIst(o.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Badge tone={o.status === "new" ? "amber" : closed ? "red" : o.status === "completed" ? "green" : "blue"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                    <Badge tone="gray">{o.fulfillment === "delivery" ? <><Truck className="h-3 w-3" /> Delivery</> : <><Footprints className="h-3 w-3" /> Pickup</>}</Badge>
                  </div>
                </div>

                {!closed && (
                  <ol className="grid grid-cols-5 gap-1.5">
                    {steps.map((s, i) => (
                      <li key={s} className={cn("h-1.5 rounded-full", idx >= i ? "bg-gradient-to-r from-emerald-500 to-emerald-700" : "bg-ink/10")} />
                    ))}
                  </ol>
                )}

                <div className="space-y-1.5 text-[13px] text-ink/70">
                  <a href={`tel:${o.phone}`} className="flex items-center gap-1.5 font-semibold text-ink hover:underline"><Phone className="h-3.5 w-3.5" /> {o.phone}</a>
                  {o.fulfillment === "delivery" && o.address && <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {o.address}{o.pincode ? `, ${o.pincode}` : ""}</p>}
                  {o.note && <p className="flex items-start gap-1.5"><StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {o.note}</p>}
                </div>

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
                  <p className="text-[11.5px] text-ink/50">Includes GST {money(o.gstAmount)}{o.deliveryFee > 0 ? ` · delivery ${money(o.deliveryFee)}` : ""}</p>
                </div>

                {actions.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-2">
                    {actions.map((a) => {
                      const Icon = ACTION_ICON[a.action] ?? Check;
                      if (a.action === "reject") {
                        return <Button key={a.action} variant="danger" disabled={busy === o.id} onClick={() => { setReason(""); setRejecting(o); }}><X className="h-4 w-4" /> {a.label}</Button>;
                      }
                      return (
                        <Button key={a.action} variant={a.action === "accept" ? "primary" : "dark"} disabled={busy === o.id} onClick={() => act(o, a.action)}>
                          <Icon className="h-4 w-4" /> {a.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </Glass>
            );
          })}
        </div>
      )}

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Decline this booking?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Back</Button>
            <Button variant="danger" disabled={busy === rejecting?.id} onClick={async () => { if (rejecting) { const o = rejecting; setRejecting(null); await act(o, "reject", { reason: reason.trim() || undefined }); } }}>Decline booking</Button>
          </>
        }
      >
        <Field label="Reason (shown to the customer)" hint="Optional">
          <input className="field" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sold out this morning" />
        </Field>
      </Modal>
    </div>
  );
}
