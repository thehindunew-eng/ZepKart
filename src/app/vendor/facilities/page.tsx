"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmptyState, Field, Skeleton, inputCls, btnPrimary, btnGhost } from "@/components/ui";
import { inr } from "@/lib/utils";

type F = { id: string; title: string; description: string | null; price: string; unit: string | null; imageUrl: string | null; isActive: boolean };

export default function FacilitiesPage() {
  const { store } = useAuth();
  const [rows, setRows] = useState<F[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<F | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", unit: "per visit", imageUrl: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!store) return;
    setLoading(true);
    const r = await fetch(`/api/facilities?storeId=${store.id}`, { cache: "no-store" }).then((x) => x.json());
    setRows(r.facilities ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const save = async () => {
    if (!store || !form.title) return;
    setSaving(true);
    if (editing) {
      setRows((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...form } as F : x)));
      await fetch(`/api/facilities/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      const r = await fetch("/api/facilities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId: store.id, ...form }) });
      const j = await r.json();
      if (j.facility) setRows((p) => [j.facility, ...p]);
    }
    setSaving(false);
    setShow(false);
    setEditing(null);
    load();
  };

  const toggle = async (f: F) => {
    setRows((prev) => prev.map((x) => (x.id === f.id ? { ...x, isActive: !x.isActive } : x)));
    await fetch(`/api/facilities/${f.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !f.isActive }) });
  };
  const remove = async (f: F) => {
    if (!confirm(`Delete "${f.title}"?`)) return;
    setRows((prev) => prev.filter((x) => x.id !== f.id));
    await fetch(`/api/facilities/${f.id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-black">✨ Extra facilities</h1>
          <p className="text-[13px] text-gray-500">Dedicated paid section to attract customers — grinding, delivery, rentals, subscriptions.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ title: "", description: "", price: "", unit: "per visit", imageUrl: "" }); setShow(true); }} className={`${btnPrimary} ml-auto`}>+ Add facility</button>
      </div>

      <div className="rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-4 text-[13px] text-purple-900">
        💡 <b>Ideas that sell:</b> atta chakki · express delivery · live food counter · bulk refill (eco) · monthly subscription · tool rental · tailoring / recharge point.
      </div>

      {loading ? <div className="grid gap-3 sm:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
        : rows.length === 0 ? <EmptyState title="No facilities yet" hint="List one paid extra — e.g. 'Atta grinding ₹30/kg' — and it shows on your storefront." action={<button onClick={() => setShow(true)} className={btnPrimary}>+ Add facility</button>} />
        : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((f) => (
              <div key={f.id} className={`overflow-hidden rounded-3xl border bg-white ${f.isActive ? "border-gray-200" : "border-gray-200 opacity-60"}`}>
                {f.imageUrl && <img src={f.imageUrl} className="h-36 w-full object-cover" alt="" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[15px] font-black">{f.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${f.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>{f.isActive ? "● LIVE" : "○ PAUSED"}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-gray-500">{f.description}</p>
                  <p className="mt-2 text-[17px] font-black text-green-700">{Number(f.price) === 0 ? "FREE" : inr(f.price)} <span className="text-[11px] font-bold text-gray-400">{f.unit}</span></p>
                  <div className="mt-3 flex gap-1.5">
                    <button onClick={() => { setEditing(f); setForm({ title: f.title, description: f.description ?? "", price: f.price, unit: f.unit ?? "per visit", imageUrl: f.imageUrl ?? "" }); setShow(true); }} className="flex-1 rounded-xl bg-gray-100 py-2 text-[12px] font-black">✏️ Edit</button>
                    <button onClick={() => toggle(f)} className="flex-1 rounded-xl bg-blue-50 py-2 text-[12px] font-black text-blue-800">{f.isActive ? "⏸ Pause" : "▶ Go live"}</button>
                    <button onClick={() => remove(f)} className="flex-1 rounded-xl bg-red-50 py-2 text-[12px] font-black text-red-700">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {show && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShow(false)}>
          <div className="w-full max-w-md rounded-[28px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-black">{editing ? "✏️ Edit facility" : "+ New facility"}</h2>
            <div className="mt-4 space-y-3">
              <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Atta Grinding — Chakki Fresh" className={inputCls} /></Field>
              <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Bring wheat, get fresh atta in 20 mins…" className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Price ₹ (0 = free)"><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" min={0} placeholder="30" className={inputCls} /></Field>
                <Field label="Unit"><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="per kg / visit / month" className={inputCls} /></Field>
              </div>
              <Field label="Image URL (optional)"><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" className={inputCls} /></Field>
              <div className="flex gap-2">
                <button onClick={() => setShow(false)} className={`${btnGhost} flex-1`}>Cancel</button>
                <button onClick={save} disabled={saving || !form.title} className={`${btnPrimary} flex-1`}>{saving ? "Saving…" : "Publish →"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
