"use client";

import { useState } from "react";
import { Crown, Check, Lock, ShieldCheck } from "lucide-react";
import { api, ApiError, useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Badge, Button, Field, Skeleton, Spinner } from "@/components/ui";
import { money } from "@/lib/utils";

type PlanResp = {
  plan: "basic" | "premium";
  planExpiresAt: string | null;
  quote: { days: number; base: number; gstRate: number; gst: number; total: number };
  features: { basic: string[]; premium: string[] };
  payments: { reference: string; amount: number; method: string; masked: string; createdAt: string }[];
  days: number;
};

export default function VendorPlan() {
  const plan = useApi<PlanResp>("/api/vendor/plan");
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [form, setForm] = useState({ upiId: "", cardName: "", cardNumber: "", expiry: "", cvv: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (plan.loading && !plan.data) return <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>;
  const d = plan.data;
  if (!d) return null;
  const isPremium = d.plan === "premium";

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body = method === "upi" ? { method, upiId: form.upiId } : { method, cardName: form.cardName, cardNumber: form.cardNumber, expiry: form.expiry, cvv: form.cvv };
      const r = await api<{ payment: { reference: string } }>("/api/vendor/plan", { json: body });
      toast(`Premium active for ${d.days} days`);
      setForm({ upiId: "", cardName: "", cardNumber: "", expiry: "", cvv: "" });
      await refresh();
      plan.reload();
      void r;
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-black tracking-tight">Plan</h1>
        <p className="text-[13.5px] text-ink/55">Choose what your shop can do on ZepKart.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-black">Basic</p>
            <Badge tone="gray">Free</Badge>
          </div>
          <ul className="mt-4 space-y-2.5">
            {d.features.basic.map((f) => <li key={f} className="flex items-center gap-2 text-[13.5px]"><Check className="h-4 w-4 text-leaf" /> {f}</li>)}
            <li className="flex items-center gap-2 text-[13.5px] text-ink/45"><Lock className="h-4 w-4" /> Wholesaler directory and restock</li>
          </ul>
          {!isPremium && <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-bold">Your current plan</p>}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#052e16] via-leaf-deep to-leaf p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-[16px] font-black"><Crown className="h-4 w-4 text-gold" /> Premium</p>
            <span className="text-[13px] font-bold text-white/80">{d.days} days</span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {d.features.premium.map((f) => <li key={f} className="flex items-center gap-2 text-[13.5px]"><Check className="h-4 w-4 text-gold" /> {f}</li>)}
          </ul>
          <div className="mt-6 rounded-xl bg-black/20 p-4 text-[13px]">
            <div className="flex justify-between"><span className="text-white/75">Plan price</span><span>{money(d.quote.base)}</span></div>
            <div className="flex justify-between"><span className="text-white/75">GST @ {d.quote.gstRate}%</span><span>{money(d.quote.gst)}</span></div>
            <div className="mt-2 flex justify-between border-t border-white/20 pt-2 text-[15px] font-black"><span>Total</span><span>{money(d.quote.total)}</span></div>
          </div>
          {isPremium && d.planExpiresAt && (
            <p className="mt-3 text-[12.5px] text-white/85">Active until {new Date(d.planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Buying again extends it.</p>
          )}
        </div>
      </div>

      <form onSubmit={pay} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-black">Pay for Premium</h2>
          <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
            {(["upi", "card"] as const).map((m) => (
              <button type="button" key={m} onClick={() => setMethod(m)} className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold ${method === m ? "bg-ink text-white" : "text-ink/65"}`}>
                {m === "upi" ? "UPI" : "Card"}
              </button>
            ))}
          </div>
        </div>
        {method === "upi" ? (
          <Field label="UPI ID">
            <input className="field" placeholder="name@bank" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
          </Field>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name on card" className="sm:col-span-2"><input className="field" value={form.cardName} onChange={(e) => setForm({ ...form, cardName: e.target.value })} /></Field>
            <Field label="Card number"><input className="field" inputMode="numeric" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} placeholder="1234 5678 9012 3456" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry"><input className="field" placeholder="MM/YY" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></Field>
              <Field label="CVV"><input className="field" inputMode="numeric" type="password" value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} /></Field>
            </div>
          </div>
        )}
        {err && <p className="text-[12.5px] font-semibold text-red-700">{err}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-[12px] text-ink/55"><ShieldCheck className="h-4 w-4" /> Demo checkout. Card numbers are never stored.</p>
          <Button type="submit" variant="dark" loading={busy}>
            {busy && <Spinner />} Pay {money(d.quote.total)}
          </Button>
        </div>
      </form>

      {d.payments.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3 text-[14px] font-black">Payments</div>
          {d.payments.map((p) => (
            <div key={p.reference} className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 text-[13px] last:border-0">
              <div>
                <p className="font-bold">{p.reference}</p>
                <p className="text-[12px] text-ink/55">{p.masked} · {new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <span className="font-black">{money(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
