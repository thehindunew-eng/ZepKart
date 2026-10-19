"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Crown, Truck, Check, X, PackageCheck, Star, MapPin } from "lucide-react";
import { api, ApiError, useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Skeleton, Spinner } from "@/components/ui";
import { money } from "@/lib/utils";

type Oos = { id: string; name: string; weightLabel: string; price: number; lastCost: number | null; stockQty: number; inStock: boolean; category: string };
type Line = { id: string; productId: string | null; itemName: string; weightLabel: string | null; qty: number; lastCost: number; quotePrice: number | null; quoteQty: number | null; grade: string | null; status: string };
type Req = { id: string; status: string; wholesaler: { id: string; businessName: string; locality: string | null; rating: number }; lines: Line[] };
type RestockResp = { premium: boolean; oos: Oos[]; requests: Req[] };
type Offer = { id: string; name: string; weightLabel: string; price: number; moq: number; stockQty: number; grade: "A" | "B" | "C"; wholesaler: { id: string; businessName: string; locality: string | null; rating: number }; distanceKm: number | null };
type Compare = { items: { productId: string; name: string; weightLabel: string; lastCost: number | null; offers: Offer[]; bestValueId: string | null }[] };
type WholesalerRow = { id: string; businessName: string; locality: string | null; city: string; rating: number; itemCount: number; distanceKm: number | null };

const GRADE_TONE: Record<string, "green" | "gold" | "gray"> = { A: "green", B: "gold", C: "gray" };
const LINE_TONE: Record<string, "gray" | "blue" | "green" | "red" | "gold"> = { requested: "gray", quoted: "blue", accepted: "gold", received: "green", declined: "red" };

export default function VendorRestock() {
  const { store } = useAuth();
  const restock = useApi<RestockResp>("/api/vendor/restock", { poll: 15000 });
  const premium = !!restock.data?.premium;
  const compare = useApi<Compare>(premium ? "/api/vendor/restock/compare" : null, { poll: 60000 });
  const wholesalers = useApi<{ wholesalers: WholesalerRow[] }>(premium ? "/api/wholesalers" : null);

  if (restock.loading && !restock.data) {
    return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-72" /></div>;
  }
  if (!premium) return <Locked oos={restock.data?.oos ?? []} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[24px] font-black tracking-tight">Restock</h1>
        <p className="text-[13.5px] text-ink/55">Send out-of-stock items to wholesalers. Compare quotes from cheapest to costliest.</p>
      </div>

      <SendPanel oos={restock.data?.oos ?? []} wholesalers={wholesalers.data?.wholesalers ?? []} loadingWholesalers={wholesalers.loading} onSent={restock.reload} />

      <section className="space-y-3">
        <h2 className="text-[17px] font-black">Price comparison</h2>
        {compare.loading && !compare.data ? (
          <Skeleton className="h-48" />
        ) : (compare.data?.items.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white"><EmptyState title="Nothing out of stock" body="Items you run out of appear here with wholesaler prices." /></div>
        ) : (
          compare.data!.items.map((item) => (
            <div key={item.productId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3.5">
                <div>
                  <p className="text-[14.5px] font-black">{item.name} <span className="font-semibold text-ink/50">· {item.weightLabel}</span></p>
                  <p className="text-[12px] text-ink/55">Last paid {item.lastCost ? money(item.lastCost) : "—"} · {item.offers.length} wholesaler{item.offers.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              {item.offers.length === 0 ? (
                <p className="px-5 py-4 text-[13px] text-ink/55">No wholesaler lists this item yet. Send a request to see quotes.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {item.offers.map((o, idx) => (
                    <div key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 sm:grid-cols-[2fr_0.7fr_0.6fr_0.7fr_0.8fr_auto]">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-bold">
                          {idx + 1}. {o.wholesaler.businessName}
                        </p>
                        <p className="text-[12px] text-ink/55">
                          {o.wholesaler.locality ?? ""}
                          {o.distanceKm != null ? ` · ${o.distanceKm} km` : ""}
                        </p>
                      </div>
                      <Badge tone={GRADE_TONE[o.grade]}>Grade {o.grade}</Badge>
                      <span className="hidden items-center gap-1 text-[12.5px] font-semibold sm:flex"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{o.wholesaler.rating.toFixed(1)}</span>
                      <span className="hidden text-[12.5px] text-ink/60 sm:block">MOQ {o.moq} · {o.stockQty} left</span>
                      <span className="text-right text-[15px] font-black">{money(o.price)}<span className="block text-[11px] font-semibold text-ink/50">per unit ex-GST</span></span>
                      <span className="flex justify-end">{item.bestValueId === o.id && <Badge tone="dark">Best value</Badge>}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[17px] font-black">Requests & quotes</h2>
        {(restock.data?.requests.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white"><EmptyState title="No requests sent yet" body="Pick items and wholesalers above to send your first request." /></div>
        ) : (
          restock.data!.requests.map((r) => <RequestCard key={r.id} r={r} onChange={restock.reload} />)
        )}
      </section>
      {store && <p className="text-[12px] text-ink/50">Accepted quotes update stock and cost when you mark them received.</p>}
    </div>
  );
}

function SendPanel({ oos, wholesalers, loadingWholesalers, onSent }: { oos: Oos[]; wholesalers: WholesalerRow[]; loadingWholesalers: boolean; onSent: () => void }) {
  const { toast } = useToast();
  const [picked, setPicked] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [items, setItems] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedItems = items ?? oos.map((o) => o.id);
  const sorted = useMemo(() => [...wholesalers].sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9)), [wholesalers]);

  const send = async () => {
    if (!picked.length) return toast("Pick at least one wholesaler", "error");
    if (!selectedItems.length) return toast("Pick at least one out-of-stock item", "error");
    setBusy(true);
    try {
      const body = { wholesalerIds: picked, items: selectedItems.map((id) => ({ productId: id, qty: qty[id] ?? 10 })) };
      const r = await api<{ sent: number; wholesalers: number }>("/api/vendor/restock", { json: body });
      toast(`Sent ${r.sent} item${r.sent === 1 ? "" : "s"} to ${r.wholesalers} wholesaler${r.wholesalers === 1 ? "" : "s"}`);
      setPicked([]);
      onSent();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not send", "error");
    } finally {
      setBusy(false);
    }
  };

  if (oos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-[14px] font-semibold text-green-900">
        <PackageCheck className="h-5 w-5" /> Every item is in stock. Nothing to restock right now.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14.5px] font-black">Out-of-stock items</h3>
          <button className="text-[12.5px] font-bold text-leaf-deep" onClick={() => setItems(selectedItems.length === oos.length ? [] : oos.map((o) => o.id))}>
            {selectedItems.length === oos.length ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="space-y-2">
          {oos.map((o) => {
            const on = selectedItems.includes(o.id);
            return (
              <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                <input type="checkbox" checked={on} onChange={() => setItems(on ? selectedItems.filter((x) => x !== o.id) : [...selectedItems, o.id])} className="h-4 w-4 accent-leaf" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">{o.name}</span>
                  <span className="text-[12px] text-ink/55">{o.weightLabel} · last paid {o.lastCost ? money(o.lastCost) : "—"}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink/60">
                  Qty
                  <input type="number" min={1} value={qty[o.id] ?? 10} onChange={(e) => setQty({ ...qty, [o.id]: Math.max(1, Number(e.target.value) || 1) })} className="field !w-20 !py-1.5" />
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-[14.5px] font-black">Send to wholesalers</h3>
        {loadingWholesalers && !wholesalers.length ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="space-y-2">
            {sorted.map((w) => {
              const on = picked.includes(w.id);
              return (
                <label key={w.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
                  <input type="checkbox" checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== w.id) : [...picked, w.id])} className="h-4 w-4 accent-leaf" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold">{w.businessName}</span>
                    <span className="flex flex-wrap items-center gap-2 text-[12px] text-ink/55">
                      <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{w.rating.toFixed(1)}</span>
                      {w.distanceKm != null && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{w.distanceKm} km</span>}
                      <span>{w.itemCount} items</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[12px] text-ink/55">{picked.length} selected</p>
          <Button variant="dark" onClick={send} loading={busy} disabled={!picked.length || !selectedItems.length}>
            {busy ? <Spinner /> : <Truck className="h-4 w-4" />} Send request
          </Button>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ r, onChange }: { r: Req; onChange: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (lineId: string, action: "accept" | "decline" | "received") => {
    setBusy(lineId);
    try {
      await api(`/api/vendor/restock/lines/${lineId}`, { method: "PATCH", json: { action } });
      toast(action === "received" ? "Stock updated" : action === "accept" ? "Quote accepted" : "Quote declined");
      onChange();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not update", "error");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3.5">
        <div>
          <p className="text-[14.5px] font-black">{r.wholesaler.businessName}</p>
          <p className="text-[12px] text-ink/55">{r.wholesaler.locality ?? ""} · ★ {r.wholesaler.rating.toFixed(1)}</p>
        </div>
        <Badge tone={r.status === "closed" ? "gray" : r.status === "quoted" ? "blue" : "gold"}>{r.status === "open" ? "Awaiting quote" : r.status === "quoted" ? "Quoted" : "Closed"}</Badge>
      </div>
      <div className="divide-y divide-gray-100">
        {r.lines.map((l) => (
          <div key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 sm:grid-cols-[1.6fr_1fr_auto]">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{l.itemName} <span className="font-semibold text-ink/50">· {l.weightLabel ?? ""}</span></p>
              <p className="text-[12px] text-ink/55">
                Requested {l.qty}
                {l.grade ? ` · grade ${l.grade}` : ""}
              </p>
            </div>
            <div className="text-[12.5px] text-ink/70">
              {l.quotePrice != null ? (
                <>
                  <span className="font-black text-ink">{money(l.quotePrice)}</span> / unit · {l.quoteQty} available
                </>
              ) : (
                <span className="text-ink/45">{l.status === "declined" ? "Not supplied" : "No quote yet"}</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <Badge tone={LINE_TONE[l.status] ?? "gray"}>{l.status}</Badge>
              {l.status === "quoted" && (
                <>
                  <button disabled={!!busy} onClick={() => act(l.id, "accept")} aria-label="Accept quote" className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-white hover:bg-leaf-deep disabled:opacity-40"><Check className="h-4 w-4" /></button>
                  <button disabled={!!busy} onClick={() => act(l.id, "decline")} aria-label="Decline quote" className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-ink hover:bg-gray-200 disabled:opacity-40"><X className="h-4 w-4" /></button>
                </>
              )}
              {l.status === "accepted" && (
                <button disabled={!!busy} onClick={() => act(l.id, "received")} className="inline-flex h-8 items-center gap-1 rounded-full bg-ink px-3 text-[12px] font-bold text-white disabled:opacity-40">
                  {busy === l.id ? <Spinner /> : <PackageCheck className="h-3.5 w-3.5" />} Received
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Locked({ oos }: { oos: Oos[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-black tracking-tight">Restock</h1>
        <p className="text-[13.5px] text-ink/55">Your out-of-stock items</p>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#052e16] via-leaf-deep to-leaf p-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider text-gold"><Crown className="h-3.5 w-3.5" /> Premium</p>
          <p className="mt-1 text-[18px] font-black">Unlock wholesalers and restock</p>
          <p className="text-[13.5px] text-white/80">Send out-of-stock items to wholesalers and compare their prices.</p>
        </div>
        <Link href="/vendor/plan" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-black text-ink">View plans</Link>
      </div>
      {oos.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white"><EmptyState title="Nothing out of stock" body="Items you run out of appear here." /></div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {oos.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div>
                <p className="text-[14px] font-bold">{o.name}</p>
                <p className="text-[12px] text-ink/55">{o.weightLabel}</p>
              </div>
              <Badge tone="red">Out of stock</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
