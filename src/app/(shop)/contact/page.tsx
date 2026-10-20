"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { api, ApiError } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { Button, Field, Glass } from "@/components/ui";

const TOPICS: { value: string; label: string }[] = [
  { value: "order", label: "My order or booking" },
  { value: "payment", label: "Payment or refund" },
  { value: "delivery", label: "Delivery or rider" },
  { value: "account", label: "Account or login" },
  { value: "vendor", label: "Selling on ZepKart (vendor)" },
  { value: "wholesale", label: "Wholesale orders" },
  { value: "other", label: "Something else" },
];

function ContactInner() {
  const params = useSearchParams();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", contact: "", topic: params.get("topic") ?? "order", orderRef: params.get("order") ?? "", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill the form from the signed-in account once
    setForm((f) => ({ ...f, name: f.name || user.name, contact: f.contact || user.phone || user.email }));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ message: string }>("/api/support", { json: { ...form, orderRef: form.orderRef || undefined } });
      setDone(r.message);
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Couldn't send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Glass className="mx-auto max-w-lg p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-leaf-deep" />
        <p className="mt-3 text-[18px] font-black">Message received</p>
        <p className="mt-1 text-[14px] text-ink/60">{done}</p>
        <Button variant="soft" className="mt-5" onClick={() => { setDone(null); setForm((f) => ({ ...f, message: "" })); }}>Send another message</Button>
      </Glass>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_280px]">
      <Glass className="p-6 sm:p-8">
        <h1 className="text-[24px] font-black tracking-tight">Contact ZepKart</h1>
        <p className="mt-1 text-[13.5px] text-ink/55">Any issue with an order, payment, delivery or account. We reply on your contact details.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
          </Field>
          <Field label="Email or phone" hint="Where should we reply?">
            <input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="field" />
          </Field>
          <Field label="What's it about?" className="sm:col-span-2">
            <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="field">
              {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Order ID (optional)" className="sm:col-span-2">
            <input value={form.orderRef} onChange={(e) => setForm({ ...form, orderRef: e.target.value })} className="field" placeholder="e.g. 3F9A1C2B" />
          </Field>
          <Field label="Message" className="sm:col-span-2">
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="field" placeholder="Tell us what happened" />
          </Field>
          {err && <p className="text-[13px] font-semibold text-red-700 sm:col-span-2">{err}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" variant="dark" loading={busy}><Send className="h-4 w-4" /> Send message</Button>
          </div>
        </form>
      </Glass>
      <Glass className="space-y-3 p-6 text-[13.5px]">
        <p className="font-black">Before you write</p>
        <ul className="list-disc space-y-2 pl-4 text-ink/65">
          <li>Track a delivery live from My orders.</li>
          <li>You can cancel a booking from My orders while it is still new.</li>
          <li>Add the order ID so we can find your booking fast.</li>
        </ul>
      </Glass>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactInner />
    </Suspense>
  );
}
