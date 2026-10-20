"use client";

import { useMemo, useState } from "react";
import { Inbox, PackageCheck, Send } from "lucide-react";
import { api, ApiError, useApi } from "@/hooks/useApi";
import { Badge, Button, EmptyState, Skeleton, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { money } from "@/lib/utils";

type Line = { id: string; itemName: string; weightLabel: string | null; qty: number; lastCost: number; quotePrice: number | null; quoteQty: number | null; status: string };
type Req = { id: string; status: string; createdAt: string; store: { shopName: string; locality: string | null; city: string }; lines: Line[] };
type Draft = { price: string; qty: string };

const LINE_TONE: Record<string, "gray" | "blue" | "green" | "red" | "gold" | "dark"> = {
  requested: "gray",
  quoted: "blue",
  accepted: "gold",
  received: "green",
  declined: "red",
};

export default function WholesalerRequests() {
  const { data, loading, reload } = useApi<{ requests: Req[] }>("/api/wholesaler/requests", { poll: 20000 });
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const open = useMemo(() => (data?.requests ?? []).filter((r) => r.status !== "closed"), [data]);
  const closed = useMemo(() => (data?.requests ?? []).filter((r) => r.status === "closed"), [data]);
  const pending = open.reduce((n, r) => n + r.lines.filter((l) => l.status === "requested").length, 0);

  const draftFor = (l: Line): Draft => drafts[l.id] ?? { price: l.quotePrice != null ? String(l.quotePrice) : l.lastCost ? String(l.lastCost) : "", qty: String(l.quoteQty ?? l.qty) };
  const setDraft = (id: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? { price: "", qty: "" }), ...patch } }));

  const sendQuote = async (r: Req) => {
    const quotes = r.lines
      .filter((l) => l.status === "requested" || l.status === "quoted")
      .map((l) => ({ lineId: l.id, ...draftFor(l) }));
    if (!quotes.length) return;
    const bad = quotes.find((q) => q.qty !== "0" && !(Number(q.price) > 0));
    if (bad) return toast("Enter a price for each item, or set quantity to 0 if you cannot supply it", "error");
    setBusy(r.id);
    try {
      await api(`/api/wholesaler/requests/${r.id}`, {
        method: "PATCH",
        json: { quotes: quotes.map((q) => ({ lineId: q.lineId, price: q.qty === "0" ? 1 : Number(q.price), qty: Number(q.qty) || 0 })) },
      });
      setDrafts((d) => {
        const next = { ...d };
        for (const q of quotes) delete next[q.lineId];
        return next;
      });
      toast("Quote sent to the shop");
      reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not send quote", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-black tracking-tight">Requests & quotes</h1>
        <p className="text-[13.5px] text-ink/55">Restock requests from shops. Quote a price and quantity for each item.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={<Inbox className="h-4 w-4" />} label="Open requests" value={open.length} />
        <Stat icon={<Send className="h-4 w-4" />} label="Items awaiting quote" value={pending} />
        <Stat icon={<PackageCheck className="h-4 w-4" />} label="Closed requests" value={closed.length} />
      </div>

      {loading && !data ? (
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : open.length === 0 && closed.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <EmptyState title="No restock requests yet" body="When a shop asks for stock, it appears here." />
        </div>
      ) : (
        <div className="space-y-4">
          {open.map((r) => (
            <RequestCard key={r.id} r={r} draftFor={draftFor} setDraft={setDraft} onSend={() => sendQuote(r)} busy={busy === r.id} />
          ))}
          {closed.length > 0 && <h2 className="pt-2 text-[14px] font-black uppercase tracking-wide text-ink/50">Closed</h2>}
          {closed.map((r) => (
            <RequestCard key={r.id} r={r} draftFor={draftFor} setDraft={setDraft} onSend={() => undefined} busy={false} readOnly />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ r, draftFor, setDraft, onSend, busy, readOnly }: { r: Req; draftFor: (l: Line) => Draft; setDraft: (id: string, p: Partial<Draft>) => void; onSend: () => void; busy: boolean; readOnly?: boolean }) {
  const editable = r.lines.some((l) => l.status === "requested" || l.status === "quoted");
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-[15px] font-black">{r.store.shopName}</p>
          <p className="text-[12.5px] text-ink/55">
            {r.store.locality ? `${r.store.locality}, ` : ""}
            {r.store.city} · {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <Badge tone={r.status === "closed" ? "gray" : r.status === "quoted" ? "blue" : "gold"}>{r.status === "open" ? "Awaiting quote" : r.status === "quoted" ? "Quoted" : "Closed"}</Badge>
      </div>
      <div className="divide-y divide-gray-100">
        {r.lines.map((l) => {
          const d = draftFor(l);
          const canEdit = !readOnly && (l.status === "requested" || l.status === "quoted");
          return (
            <div key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[1.4fr_0.7fr_0.8fr_0.7fr_auto]">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold">{l.itemName}</p>
                <p className="text-[12px] text-ink/55">
                  {l.weightLabel ?? ""} · requested {l.qty}
                  {l.lastCost ? ` · last paid ${money(l.lastCost)}` : ""}
                </p>
              </div>
              <div className="hidden text-[12.5px] text-ink/60 sm:block">{l.status === "quoted" ? `Quoted ${money(l.quotePrice)} × ${l.quoteQty}` : ""}</div>
              {canEdit ? (
                <label className="hidden text-[11px] font-bold uppercase tracking-wide text-ink/50 sm:block">
                  Price / unit
                  <input inputMode="decimal" value={d.price} onChange={(e) => setDraft(l.id, { price: e.target.value })} className="field mt-1 !py-2" placeholder="₹" />
                </label>
              ) : <span className="hidden sm:block" />}
              {canEdit ? (
                <label className="hidden text-[11px] font-bold uppercase tracking-wide text-ink/50 sm:block">
                  Qty you can supply
                  <input inputMode="numeric" value={d.qty} onChange={(e) => setDraft(l.id, { qty: e.target.value })} className="field mt-1 !py-2" />
                </label>
              ) : <span className="hidden sm:block" />}
              <Badge tone={LINE_TONE[l.status] ?? "gray"}>{l.status}</Badge>
              {canEdit && (
                <div className="col-span-2 grid grid-cols-2 gap-2 sm:hidden">
                  <input inputMode="decimal" value={d.price} onChange={(e) => setDraft(l.id, { price: e.target.value })} className="field !py-2" placeholder="Price ₹" />
                  <input inputMode="numeric" value={d.qty} onChange={(e) => setDraft(l.id, { qty: e.target.value })} className="field !py-2" placeholder="Qty" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {editable && !readOnly && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <p className="text-[12px] text-ink/55">Set quantity to 0 for items you cannot supply.</p>
          <Button variant="dark" size="sm" onClick={onSend} loading={busy}>
            {busy && <Spinner />}
            Send quote
          </Button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-ink/50">{icon} {label}</p>
      <p className="mt-1 text-[26px] font-black">{value}</p>
    </div>
  );
}
