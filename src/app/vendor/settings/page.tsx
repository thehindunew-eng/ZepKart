"use client";

import { useState } from "react";
import { api } from "@/hooks/useApi";
import { useAuth, type VendorStore } from "@/components/AuthProvider";
import { useVendorGate } from "@/components/vendor/useVendorData";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/components/Toast";
import { Button, Field, Glass, Skeleton, Switch } from "@/components/ui";
import { CATEGORIES, CITIES } from "@/lib/ncr";

type Form = {
  shopName: string;
  description: string;
  dpUrl: string | null;
  coverUrl: string | null;
  whatsapp: string;
  phone: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  category: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  deliveryFee: string;
  freeDeliveryAbove: string;
  minOrder: string;
  etaMinutes: string;
  openingHours: string;
};

const fromStore = (s: VendorStore & { phone?: string | null }): Form => ({
  shopName: s.shopName,
  description: s.description ?? "",
  dpUrl: s.dpUrl,
  coverUrl: s.coverUrl,
  whatsapp: s.whatsapp ?? "",
  phone: s.phone ?? "",
  address: s.address ?? "",
  locality: s.locality ?? "",
  city: s.city,
  pincode: s.pincode ?? "",
  category: s.category,
  pickupAvailable: s.pickupAvailable,
  deliveryAvailable: s.deliveryAvailable,
  deliveryFee: String(s.deliveryFee),
  freeDeliveryAbove: String(s.freeDeliveryAbove),
  minOrder: String(s.minOrder),
  etaMinutes: String(s.etaMinutes),
  openingHours: s.openingHours ?? "",
});

export default function SettingsPage() {
  const gate = useVendorGate();
  if (!gate.ready || !gate.store) return <Skeleton className="h-[600px]" />;
  return <SettingsForm key={gate.store.id} store={gate.store as VendorStore & { phone?: string | null }} />;
}

function SettingsForm({ store }: { store: VendorStore & { phone?: string | null } }) {
  const { setStore } = useAuth();
  const { toast } = useToast();
  const [f, setF] = useState<Form>(() => fromStore(store));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const amount = (v: string) => (v === "" ? 0 : Number(v));

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        shopName: f.shopName.trim(),
        description: f.description.trim() || null,
        dpUrl: f.dpUrl,
        coverUrl: f.coverUrl,
        whatsapp: f.whatsapp.trim(),
        phone: f.phone.trim() || null,
        address: f.address.trim(),
        locality: f.locality.trim(),
        city: f.city,
        pincode: f.pincode.trim(),
        category: f.category,
        pickupAvailable: f.pickupAvailable,
        deliveryAvailable: f.deliveryAvailable,
        deliveryFee: amount(f.deliveryFee),
        freeDeliveryAbove: amount(f.freeDeliveryAbove),
        minOrder: amount(f.minOrder),
        etaMinutes: Number(f.etaMinutes) || 30,
        openingHours: f.openingHours.trim() || undefined,
      };
      const r = await api<{ store: VendorStore & { phone?: string | null } }>("/api/vendor/store", { method: "PATCH", json: body });
      setStore(r.store);
      setF(fromStore(r.store));
      toast("Shop details saved");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-black tracking-tight">Shop settings</h1>
          <p className="text-[14px] text-ink/55">What customers see about your shop.</p>
        </div>
        <Button loading={busy} onClick={save}>Save changes</Button>
      </div>

      <Glass className="space-y-6 p-5 sm:p-7">
        <section className="grid gap-6 md:grid-cols-[220px_1fr]">
          <ImageUpload value={f.dpUrl} onChange={(u) => set("dpUrl", u)} label="Shop DP" shape="round" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Shop name"><input className="field" value={f.shopName} maxLength={160} onChange={(e) => set("shopName", e.target.value)} /></Field></div>
            <Field label="Category">
              <select className="field" value={f.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Typical prep time (min)"><input className="field" inputMode="numeric" value={f.etaMinutes} onChange={(e) => set("etaMinutes", e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="About your shop"><textarea className="field min-h-[72px]" maxLength={1000} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink/50">Cover</p>
          <ImageUpload value={f.coverUrl} onChange={(u) => set("coverUrl", u)} label="Cover photo" shape="wide" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" hint="Customers can message you here"><input className="field" inputMode="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="98xxxxxx10" /></Field>
          <Field label="Phone (private)" hint="Used for booking alerts. Never shown publicly."><input className="field" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Shop address"><input className="field" value={f.address} maxLength={300} onChange={(e) => set("address", e.target.value)} /></Field></div>
          <Field label="Locality"><input className="field" value={f.locality} onChange={(e) => set("locality", e.target.value)} /></Field>
          <Field label="City">
            <select className="field" value={f.city} onChange={(e) => set("city", e.target.value)}>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Pincode" hint="Delhi 110xxx · Noida 201xxx · Gurugram 122xxx"><input className="field" inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => set("pincode", e.target.value)} /></Field>
          <Field label="Opening hours (text)"><input className="field" value={f.openingHours} maxLength={120} onChange={(e) => set("openingHours", e.target.value)} placeholder="8:00 AM – 10:00 PM" /></Field>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="glass-strong rounded-2xl p-4"><Switch checked={f.pickupAvailable} onChange={(v) => set("pickupAvailable", v)} label="Pickup" /></div>
          <div className="glass-strong rounded-2xl p-4"><Switch checked={f.deliveryAvailable} onChange={(v) => set("deliveryAvailable", v)} label="Delivery" /></div>
          <Field label="Delivery fee (₹)"><input className="field" inputMode="decimal" value={f.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} /></Field>
          <Field label="Free delivery above (₹)" hint="0 for no threshold"><input className="field" inputMode="decimal" value={f.freeDeliveryAbove} onChange={(e) => set("freeDeliveryAbove", e.target.value)} /></Field>
          <Field label="Minimum order (₹)"><input className="field" inputMode="decimal" value={f.minOrder} onChange={(e) => set("minOrder", e.target.value)} /></Field>
        </section>

        {err && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-2.5 text-[13px] font-semibold text-red-800">{err}</p>}
      </Glass>
    </div>
  );
}
