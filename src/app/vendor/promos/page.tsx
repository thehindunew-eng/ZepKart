"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmptyState, Field, Skeleton, inputCls, btnPrimary } from "@/components/ui";
import { AD_RATE_CARD, adPrice, inr } from "@/lib/utils";

type V = { id: string; title: string; description: string | null; videoUrl: string | null; thumbnailUrl: string | null; durationSec: number; season: string; amountPaid: string; status: string; endsAt: string | null };

export default function PromosPage() {
  const { store } = useAuth();
  const [rows, setRows] = useState<V[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [season, setSeason] = useState<string>("Normal");
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!store) return;
    setLoading(true);
    const r = await fetch(`/api/promos?storeId=${store.id}`, { cache: "no-store" }).then((x) => x.json());
    setRows(r.promos ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const charge = adPrice(season, days);

  const publish = async () => {
    if (!store) return;
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store.id, title, description: desc, videoUrl, season, days, durationSec: 60, thumbnailUrl: store.dpUrl }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) {
      setMsg(j.error || "Failed");
      return;
    }
    setMsg(`✅ Live! Charged ${inr(j.charged)} for ${days} day(s) · ${season} slot.`);
    setTitle("");
    setDesc("");
    setVideoUrl("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this ad?")) return;
    setRows((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/promos/${id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-black">▶ 60-sec video ads</h1>
        <p className="text-[13px] text-gray-500">Promote anything — new stock, festival offer, store story. Charged per season & demand, max ~1 minute.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AD_RATE_CARD.map((r) => (
          <button key={r.season} onClick={() => setSeason(r.season)} className={`rounded-3xl border p-4 text-left transition ${season === r.season ? "border-neutral-900 bg-neutral-900 text-white shadow-lg" : "border-gray-200 bg-white hover:border-gray-300"}`}>
            <p className="text-[12px] font-black uppercase tracking-wide opacity-70">{r.label}</p>
            <p className="mt-1 text-[22px] font-black">{inr(r.perDay)}<span className="text-[12px] font-bold opacity-60">/day</span></p>
            <p className={`mt-1 text-[12px] ${season === r.season ? "text-white/70" : "text-gray-500"}`}>{r.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
          <p className="text-[14px] font-black">Upload your ad</p>
          <div className="mt-3 space-y-3">
            <Field label="Ad title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning Veggie Rush — 20% off before 10 AM!" className={inputCls} /></Field>
            <Field label="What should customers know?"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Farm veggies in 6 hrs, live counter…" className={inputCls} /></Field>
            <Field label="Video URL (mp4, ≤ 60 sec)" hint="Paste an mp4 link, or pick a sample below. Direct device upload for large video is disabled in demo — use a link.">
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/promo.mp4" className={inputCls} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {[
                ["Sample: Big Buck Bunny", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"],
                ["Sample: Blazes", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"],
                ["Sample: Joyrides", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"],
              ].map(([l, u]) => (
                <button key={u} onClick={() => setVideoUrl(u)} className="rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-bold hover:bg-gray-200">{l}</button>
              ))}
            </div>
            {videoUrl && <video src={videoUrl} controls preload="metadata" className="aspect-video w-full rounded-2xl bg-black object-cover" />}
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3.5">
              <label className="text-[13px] font-bold">Run for <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value))))} className="mx-1 w-16 rounded-lg border border-gray-200 px-2 py-1 text-center font-black" /> day(s)</label>
              <span className="ml-auto text-[15px] font-black">Total {inr(charge)}</span>
            </div>
            {msg && <p className={`rounded-2xl px-4 py-3 text-[13px] font-bold ${msg.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg}</p>}
            <button onClick={publish} disabled={busy || !title || !videoUrl} className={`${btnPrimary} w-full !py-3.5`}>{busy ? "Publishing…" : `Pay ${inr(charge)} & go live →`}</button>
            <p className="text-[11.5px] text-gray-400">Demo checkout — no real money moves. In production this connects to Razorpay/UPI.</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[14px] font-black">Your ads ({rows.length})</p>
          {loading ? <Skeleton className="h-48" /> : rows.length === 0 ? <EmptyState title="No ads yet" hint="Your 60-sec video will appear on the homepage strip." /> : rows.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-3xl bg-neutral-950 text-white">
              <video src={v.videoUrl || ""} poster={v.thumbnailUrl || ""} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
              <div className="p-4">
                <p className="text-[13.5px] font-black">{v.title}</p>
                <p className="mt-1 flex items-center justify-between text-[11.5px] text-white/60">
                  <span>{v.season} · {inr(v.amountPaid)} paid</span>
                  <button onClick={() => remove(v.id)} className="rounded-lg bg-white/10 px-2.5 py-1 font-bold hover:bg-white/20">Remove</button>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
