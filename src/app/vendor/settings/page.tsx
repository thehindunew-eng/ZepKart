"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Field, inputCls, btnPrimary } from "@/components/ui";
import { inr } from "@/lib/utils";

export default function StoreSettings() {
  const { store, refresh } = useAuth();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (store) setForm({ ...store });
  }, [store?.id]);

  if (!form) return <div className="rounded-3xl border bg-white p-8 text-center text-sm text-gray-500">Loading store…</div>;

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const save = async () => {
    setSaving(true);
    setMsg("");
    const r = await fetch(`/api/stores/${store!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (r.ok) {
      setMsg("✅ Store updated — customers see it live.");
      refresh();
    } else setMsg("❌ Failed to save");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-black">⚙️ Store settings</h1>
        <p className="text-[13px] text-gray-500">DP + shop name, open/close with next timings, WhatsApp, pickup/delivery — all live.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* DP + open/close card */}
        <div className="h-fit rounded-3xl border border-gray-200 bg-white p-5">
          <p className="text-[13px] font-black uppercase tracking-wide text-gray-500">Shop display picture</p>
          <img src={form.dpUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=70"} className="mt-3 aspect-square w-full rounded-3xl border border-gray-200 object-cover" alt="" />
          <Field label="DP image URL">
            <div className="mt-1"><input value={form.dpUrl ?? ""} onChange={(e) => set("dpUrl", e.target.value)} placeholder="https://…" className={inputCls} /></div>
          </Field>
          <label className="mt-2 block cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-center text-[12.5px] font-bold hover:bg-gray-100">
            📤 Upload DP from device
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) set("dpUrl", await fileToDataUrl(f));
            }} />
          </label>

          <div className={`mt-4 rounded-3xl p-4 ${form.isOpen ? "bg-green-50 ring-1 ring-green-200" : "bg-gray-100"}`}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-black">{form.isOpen ? "● Open now" : "○ Closed"}</p>
              <button onClick={() => set("isOpen", !form.isOpen)} className={`relative h-8 w-14 rounded-full transition ${form.isOpen ? "bg-green-600" : "bg-gray-300"}`}>
                <span className={`absolute top-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] shadow transition-all ${form.isOpen ? "left-7" : "left-1"}`}>{form.isOpen ? "●" : "○"}</span>
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <Field label="Next closing (shown when open)"><input value={form.nextClosingAt ?? ""} onChange={(e) => set("nextClosingAt", e.target.value)} placeholder="Closes 10:30 PM today" className={inputCls} /></Field>
              <Field label="Next opening (shown when closed)"><input value={form.nextOpeningAt ?? ""} onChange={(e) => set("nextOpeningAt", e.target.value)} placeholder="Opens 7:00 AM tomorrow" className={inputCls} /></Field>
            </div>
          </div>
        </div>

        {/* details */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="grid gap-3.5">
            <Field label="Shop name"><input value={form.shopName ?? ""} onChange={(e) => set("shopName", e.target.value)} className={inputCls} /></Field>
            <Field label="Tagline / description"><textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} /></Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Phone"><input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inputCls} /></Field>
              <Field label="WhatsApp number" hint="Customers tap to chat — include country code optional"><input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label="Address"><input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inputCls} /></Field>
            <div className="grid gap-3.5 sm:grid-cols-3">
              <Field label="City"><input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} className={inputCls} /></Field>
              <Field label="Category"><input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} className={inputCls} /></Field>
              <Field label="Opening hours"><input value={form.openingHours ?? ""} onChange={(e) => set("openingHours", e.target.value)} className={inputCls} /></Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-4">
                <label className="flex items-center justify-between text-[13.5px] font-black">
                  🛵 Home delivery
                  <input type="checkbox" checked={!!form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} className="h-5 w-5 accent-green-700" />
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Fee ₹"><input value={form.deliveryFee ?? "0"} onChange={(e) => set("deliveryFee", e.target.value)} type="number" className={inputCls} /></Field>
                  <Field label="Radius km"><input value={form.deliveryRadiusKm ?? "5"} onChange={(e) => set("deliveryRadiusKm", e.target.value)} type="number" className={inputCls} /></Field>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <label className="flex items-center justify-between text-[13.5px] font-black">
                  🏃 Store pickup
                  <input type="checkbox" checked={!!form.pickupAvailable} onChange={(e) => set("pickupAvailable", e.target.checked)} className="h-5 w-5 accent-green-700" />
                </label>
                <p className="mt-2 text-[12.5px] text-gray-500">Customers choose <b>{form.pickupAvailable ? "pickup (free)" : "delivery only"}</b> at checkout and in chat. {form.deliveryAvailable ? `Delivery ${inr(form.deliveryFee ?? 0)} within ${form.deliveryRadiusKm ?? 5} km.` : ""}</p>
              </div>
            </div>

            {msg && <p className={`rounded-2xl px-4 py-3 text-[13px] font-bold ${msg.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg}</p>}
            <button onClick={save} disabled={saving} className={`${btnPrimary} !py-3.5`}>{saving ? "Saving…" : "💾 Save — goes live instantly"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
