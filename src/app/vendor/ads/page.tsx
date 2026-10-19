"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Loader2, Film, Trash2, CreditCard, Smartphone, CheckCircle2, Receipt, Play } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { useVendorGate } from "@/components/vendor/useVendorData";
import { Badge, Button, EmptyState, Field, Glass, Modal, Skeleton } from "@/components/ui";
import { money, cn } from "@/lib/utils";
import { formatDateTimeIst, formatDateIst } from "@/lib/time";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  durationSec: number;
  planDays: number;
  status: string;
  seasonName: string;
  seasonMultiplier: number;
  demandMultiplier: number;
  lengthFactor: number;
  planDiscountPct: number;
  baseAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  total: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

type Quote = {
  durationSec: number;
  planDays: number;
  planLabel: string;
  lengthFactor: number;
  seasonName: string;
  seasonMultiplier: number;
  demandMultiplier: number;
  activeCampaigns: number;
  base: number;
  seasonal: number;
  demand: number;
  planDiscountPct: number;
  discount: number;
  taxable: number;
  gstRate: number;
  gst: number;
  total: number;
};

const PLANS = [
  { days: 7, label: "1 week", discountPct: 0 },
  { days: 15, label: "15 days", discountPct: 10 },
  { days: 30, label: "30 days", discountPct: 20 },
];

const STATUS_TONE: Record<string, "gray" | "green" | "amber"> = { draft: "amber", active: "green", expired: "gray" };
const STATUS_TEXT: Record<string, string> = { draft: "Unpaid draft", active: "Live", expired: "Ended" };

export default function AdsPage() {
  const gate = useVendorGate();
  const campaigns = useApi<{ campaigns: Campaign[] }>(gate.ready ? "/api/ads" : null, { poll: 10000 });
  const payments = useApi<{ payments: { id: string; reference: string; amount: number; method: string; masked: string; status: string; createdAt: string; purpose: string }[] }>(gate.ready ? "/api/payments" : null, { poll: 15000 });
  const overview = useApi<{ market: { season: string; seasonMultiplier: number; demandMultiplier: number; activeCampaigns: number } }>(gate.ready ? "/api/vendor/overview" : null, { poll: 30000 });
  const { toast } = useToast();

  const [video, setVideo] = useState<{ url: string; durationSec: number; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [planDays, setPlanDays] = useState(7);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [payFor, setPayFor] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live price preview for the chosen video length and plan.
  const shownQuote = video ? quote : null;
  useEffect(() => {
    if (!video) return;
    let cancel = false;
    const t = setTimeout(async () => {
      try {
        const r = await api<{ quote: Quote }>("/api/ads/quote", { json: { durationSec: video.durationSec, planDays } });
        if (!cancel) setQuote(r.quote);
      } catch (e) {
        if (!cancel) toast((e as Error).message, "error");
      }
    }, 150);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [video, planDays, toast]);

  const onFile = async (file: File) => {
    if (file.size > 60 * 1024 * 1024) return toast("Video must be 60 MB or smaller", "error");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "video");
      const r = await api<{ url: string; durationSec: number | null }>("/api/uploads", { body: fd });
      if (!r.durationSec) throw new Error("We couldn't read this video's length.");
      setVideo({ url: r.url, durationSec: Math.ceil(r.durationSec), name: file.name });
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 80));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const createDraft = async () => {
    if (!video) return;
    setSaving(true);
    try {
      const r = await api<{ campaign: Campaign }>("/api/ads", {
        json: { title: title.trim(), description: description.trim() || null, videoUrl: video.url, durationSec: video.durationSec, planDays },
      });
      campaigns.setData((d) => (d ? { campaigns: [r.campaign, ...d.campaigns] } : { campaigns: [r.campaign] }));
      setVideo(null);
      setTitle("");
      setDescription("");
      setPayFor(r.campaign);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const removeDraft = async (c: Campaign) => {
    setDeleting(c.id);
    try {
      await api(`/api/ads/${c.id}`, { method: "DELETE" });
      campaigns.setData((d) => (d ? { campaigns: d.campaigns.filter((x) => x.id !== c.id) } : d));
      toast("Draft removed");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setDeleting(null);
    }
  };

  const list = campaigns.data?.campaigns ?? [];
  const market = overview.data?.market;

  if (!gate.ready) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-black tracking-tight">Ads</h1>
        <p className="text-[14px] text-ink/55">Short video ads that play on the home page and your shop page.</p>
      </div>

      {market && (
        <div className="flex flex-wrap gap-2 text-[12.5px] font-bold">
          <Badge tone="gold">{market.season} · ×{market.seasonMultiplier.toFixed(2)}</Badge>
          <Badge tone="blue">Demand ×{market.demandMultiplier.toFixed(2)} · {market.activeCampaigns} live ads</Badge>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <Glass className="space-y-5 p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[15px] font-extrabold"><Film className="h-4 w-4" /> New ad</p>

          {!video ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink/15 bg-white/40 p-6 text-center transition hover:bg-white/60"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-ink/50" /> : <Upload className="h-6 w-6 text-ink/50" />}
              <span className="text-[14px] font-bold">{uploading ? "Uploading…" : "Choose a video"}</span>
              <span className="text-[12px] text-ink/50">MP4 or MOV · up to 60 seconds</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-3xl bg-black">
                { }
                <video src={video.url} className="aspect-video w-full object-contain" controls muted playsInline preload="metadata" />
              </div>
              <div className="flex items-center justify-between text-[12.5px] text-ink/60">
                <span className="truncate">{video.name}</span>
                <span className="flex items-center gap-2"><Play className="h-3.5 w-3.5" /> {video.durationSec}s <button className="font-bold text-ink hover:underline" onClick={() => setVideo(null)}>Change</button></span>
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

          <div className="grid gap-4">
            <Field label="Title"><input className="field" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Description (optional)"><input className="field" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <div>
              <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.08em] text-ink/60">Plan</span>
              <div className="grid grid-cols-3 gap-2">
                {PLANS.map((p) => (
                  <button key={p.days} type="button" onClick={() => setPlanDays(p.days)} className={cn("rounded-2xl border p-3 text-left transition", planDays === p.days ? "border-ink bg-ink text-white shadow-lg" : "border-white/80 bg-white/50 hover:bg-white/80")}>
                    <p className="text-[14px] font-black">{p.label}</p>
                    <p className={cn("text-[11.5px] font-semibold", planDays === p.days ? "text-white/70" : "text-ink/55")}>{p.discountPct ? `${p.discountPct}% off` : "Standard"}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/50 p-4 text-[13.5px]">
            {!shownQuote ? (
              <p className="text-ink/55">{video ? "Calculating…" : "Add a video to see the price."}</p>
            ) : (
              <div className="space-y-1.5">
                <Row label={`Base · ${shownQuote.planDays} days × ${shownQuote.durationSec}s`} value={money(shownQuote.base)} />
                <Row label={`Season · ${shownQuote.seasonName} ×${shownQuote.seasonMultiplier.toFixed(2)}`} value={money(shownQuote.seasonal)} />
                <Row label={`Demand ×${shownQuote.demandMultiplier.toFixed(2)}`} value={money(shownQuote.demand)} />
                {shownQuote.discount > 0 && <Row label={`Plan discount ${shownQuote.planDiscountPct}%`} value={`− ${money(shownQuote.discount)}`} tone="text-emerald-700" />}
                <Row label="Taxable value" value={money(shownQuote.taxable)} />
                <Row label={`GST ${shownQuote.gstRate}%`} value={money(shownQuote.gst)} />
                <div className="my-2 h-px bg-ink/10" />
                <Row label="Total payable" value={money(shownQuote.total)} strong />
              </div>
            )}
          </div>

          <Button block size="lg" disabled={!video || !title.trim() || saving} loading={saving} onClick={createDraft}>
            <CreditCard className="h-4 w-4" /> Continue to payment
          </Button>
        </Glass>

        <div className="space-y-4">
          <p className="text-[15px] font-extrabold">Your ads</p>
          {campaigns.loading && !campaigns.data ? (
            <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-40" />)}</div>
          ) : list.length === 0 ? (
            <Glass><EmptyState icon={<Film className="h-6 w-6" />} title="No ads yet" body="Upload a short video to feature your shop on the home page." /></Glass>
          ) : (
            list.map((c) => (
              <Glass key={c.id} className="rise flex gap-4 p-4">
                <div className="w-28 shrink-0 overflow-hidden rounded-2xl bg-black">
                  { }
                  <video src={c.videoUrl} className="aspect-[4/5] w-full object-cover" muted preload="metadata" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14.5px] font-extrabold">{c.title}</p>
                    <Badge tone={STATUS_TONE[c.status] ?? "gray"}>{STATUS_TEXT[c.status] ?? c.status}</Badge>
                  </div>
                  <p className="text-[12.5px] text-ink/55">{c.durationSec}s · {c.planDays} days · {c.seasonName}</p>
                  {c.startsAt && c.endsAt && <p className="text-[12px] text-ink/55">{formatDateIst(c.startsAt)} → {formatDateIst(c.endsAt)}</p>}
                  <p className="text-[14px] font-black tabular-nums">{money(c.total)} <span className="text-[11.5px] font-semibold text-ink/50">incl. GST</span></p>
                  <div className="flex gap-2 pt-1">
                    {c.status === "draft" && <Button size="sm" onClick={() => setPayFor(c)}><CreditCard className="h-3.5 w-3.5" /> Pay now</Button>}
                    {c.status === "draft" && <Button size="sm" variant="ghost" loading={deleting === c.id} onClick={() => removeDraft(c)}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>}
                  </div>
                </div>
              </Glass>
            ))
          )}

          <Glass className="p-5">
            <p className="mb-3 flex items-center gap-2 text-[15px] font-extrabold"><Receipt className="h-4 w-4" /> Payments</p>
            {(payments.data?.payments.length ?? 0) === 0 ? (
              <p className="text-[13px] text-ink/55">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {payments.data!.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{p.reference}</p>
                      <p className="truncate text-[12px] text-ink/55">{p.masked} · {formatDateTimeIst(p.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black tabular-nums">{money(p.amount)}</p>
                      <p className="text-[11.5px] font-bold text-emerald-700">{p.status === "succeeded" ? "Paid" : p.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Glass>
        </div>
      </div>

      <PayModal key={payFor?.id ?? "none"} campaign={payFor} onClose={() => setPayFor(null)} onPaid={(c) => { campaigns.setData((d) => (d ? { campaigns: d.campaigns.map((x) => (x.id === c.id ? c : x)) } : d)); payments.reload(); }} />
    </div>
  );
}

function Row({ label, value, tone = "", strong }: { label: string; value: string; tone?: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", strong ? "text-[17px] font-black" : "font-semibold text-ink/75", tone)}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function PayModal({ campaign, onClose, onPaid }: { campaign: Campaign | null; onClose: () => void; onPaid: (c: Campaign) => void }) {
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ cardName: "", cardNumber: "", expiry: "", cvv: "" });
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ reference: string; masked: string; amount: number } | null>(null);
  const { toast } = useToast();

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

  const pay = async () => {
    if (!campaign) return;
    setBusy(true);
    try {
      const body = method === "upi" ? { method, upiId: upiId.trim() } : { method, ...card, cardNumber: card.cardNumber.replace(/\s/g, "") };
      const r = await api<{ campaign: Campaign; payment: { reference: string; masked: string; amount: number } }>(`/api/ads/${campaign.id}/pay`, { json: body });
      setReceipt(r.payment);
      setCard({ cardName: "", cardNumber: "", expiry: "", cvv: "" });
      onPaid(r.campaign);
      toast("Payment received. Your ad is live.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!campaign} onClose={onClose} title={receipt ? "Payment received" : "Pay for your ad"} footer={receipt ? <Button onClick={onClose}>Done</Button> : <><Button variant="ghost" onClick={onClose}>Later</Button><Button loading={busy} onClick={pay} disabled={method === "upi" ? !upiId : !card.cardName || !card.cardNumber || !card.expiry || !card.cvv}>Pay {campaign ? money(campaign.total) : ""}</Button></>}>
      {receipt ? (
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <p className="text-[18px] font-black">{money(receipt.amount)} paid</p>
          <p className="text-[13px] text-ink/60">Reference {receipt.reference} · {receipt.masked}</p>
        </div>
      ) : campaign ? (
        <div className="space-y-5">
          <div className="glass-pill grid grid-cols-2 rounded-full p-1 text-[13px] font-bold">
            <button onClick={() => setMethod("upi")} className={cn("flex items-center justify-center gap-1.5 rounded-full py-2", method === "upi" ? "bg-ink text-white" : "text-ink/65")}><Smartphone className="h-4 w-4" /> UPI</button>
            <button onClick={() => setMethod("card")} className={cn("flex items-center justify-center gap-1.5 rounded-full py-2", method === "card" ? "bg-ink text-white" : "text-ink/65")}><CreditCard className="h-4 w-4" /> Card</button>
          </div>
          {method === "upi" ? (
            <Field label="UPI ID"><input className="field" placeholder="name@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} autoComplete="off" /></Field>
          ) : (
            <div className="grid gap-3">
              <Field label="Name on card"><input className="field" value={card.cardName} onChange={(e) => setCard({ ...card, cardName: e.target.value })} autoComplete="cc-name" /></Field>
              <Field label="Card number"><input className="field" inputMode="numeric" value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: formatCard(e.target.value) })} autoComplete="cc-number" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expiry (MM/YY)"><input className="field" inputMode="numeric" maxLength={5} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} autoComplete="cc-exp" /></Field>
                <Field label="CVV"><input className="field" inputMode="numeric" maxLength={4} type="password" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} autoComplete="cc-csc" /></Field>
              </div>
            </div>
          )}
          <p className="text-center text-[12px] text-ink/45">Demo checkout. Nothing is charged.</p>
        </div>
      ) : null}
    </Modal>
  );
}
