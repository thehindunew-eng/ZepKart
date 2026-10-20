"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { Button, Field, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { AREAS, CITIES, type City } from "@/lib/ncr";

export default function WholesalerProfile() {
  const { wholesaler, refresh, user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ businessName: "", description: "", gstin: "", phone: "", city: "Delhi" as City, locality: "", pincode: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!wholesaler) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form fields from the loaded profile
    setForm({
      businessName: wholesaler.businessName ?? "",
      description: wholesaler.description ?? "",
      gstin: wholesaler.gstin ?? "",
      phone: wholesaler.phone ?? "",
      city: (wholesaler.city as City) ?? "Delhi",
      locality: wholesaler.locality ?? "",
      pincode: wholesaler.pincode ?? "",
      address: wholesaler.address ?? "",
    });
  }, [wholesaler]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api("/api/wholesaler/profile", { method: "PATCH", json: { ...form, gstin: form.gstin || null } });
      await refresh();
      toast("Profile saved");
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-black tracking-tight">Business profile</h1>
        <p className="text-[13.5px] text-ink/55">Shops see your business name, area, and rating. Your personal contact stays private.</p>
      </div>
      <form onSubmit={save} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
        <Field label="Business name" className="sm:col-span-2">
          <input required className="field" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        </Field>
        <Field label="About" className="sm:col-span-2">
          <textarea rows={3} className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="City">
          <select className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value as City, locality: AREAS[e.target.value as City][0] })}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Area">
          <select className="field" value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })}>
            {(AREAS[form.city] ?? []).map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Pincode">
          <input className="field" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </Field>
        <Field label="GSTIN">
          <input className="field uppercase" maxLength={15} value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="15-character GSTIN" />
        </Field>
        <Field label="Warehouse address" className="sm:col-span-2">
          <input className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <p className="text-[12.5px] text-ink/50 sm:col-span-2">Signed in as {user?.email}</p>
        {err && <p className="text-[12.5px] font-semibold text-red-700 sm:col-span-2">{err}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" variant="dark" loading={busy}>
            {busy && <Spinner />} Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
