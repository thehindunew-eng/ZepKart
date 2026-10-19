"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Badge, EmptyState, Skeleton, Field, inputCls, btnPrimary, btnGhost } from "@/components/ui";
import { CATEGORIES, inr } from "@/lib/utils";

type P = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  mrp: string | null;
  weight: string | null;
  stockQty: number;
  status: string;
  category: string | null;
  isFeatured: boolean;
  updatedAt: string;
};

const BLANK = { name: "", description: "", imageUrl: "", price: "", mrp: "", weight: "500g", category: "Staples", stockQty: 20, isFeatured: false };

export default function InventoryPage() {
  const { store } = useAuth();
  const [items, setItems] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<P | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!store) return;
    setLoading(true);
    const r = await fetch(`/api/products?storeId=${store.id}`, { cache: "no-store" }).then((x) => x.json());
    setItems(r.products ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const filtered = useMemo(() => {
    let r = items;
    if (q) r = r.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (filter === "Available") r = r.filter((p) => p.status !== "oos");
    if (filter === "OOS") r = r.filter((p) => p.status === "oos");
    if (filter === "Featured") r = r.filter((p) => p.isFeatured);
    return r;
  }, [items, q, filter]);

  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(f);
    });

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setShowForm(true);
  };
  const openEdit = (p: P) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", imageUrl: p.imageUrl ?? "", price: p.price, mrp: p.mrp ?? "", weight: p.weight ?? "500g", category: p.category ?? "Staples", stockQty: p.stockQty, isFeatured: p.isFeatured });
    setShowForm(true);
  };

  const save = async () => {
    if (!store || !form.name || !form.price) return;
    setSaving(true);
    const payload = { storeId: store.id, ...form };
    if (editing) {
      // optimistic
      setItems((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...payload, price: String(payload.price), mrp: String(payload.mrp || payload.price) } as P : p)));
      await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      const r = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.product) setItems((prev) => [j.product, ...prev]);
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const quickPatch = async (p: P, patch: Record<string, unknown>) => {
    setPendingIds((s) => new Set(s).add(p.id));
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...patch } as P : x))); // optimistic
    await fetch(`/api/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setPendingIds((s) => {
      const n = new Set(s);
      n.delete(p.id);
      return n;
    });
  };

  const remove = async (p: P) => {
    if (!confirm(`Delete "${p.name}"? Customers won't see it anymore.`)) return;
    setItems((prev) => prev.filter((x) => x.id !== p.id)); // optimistic
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-black">📦 Live inventory</h1>
          <p className="text-[13px] text-gray-500">Photo · price · weight · available/OOS — updates reflect instantly for customers.</p>
        </div>
        <button onClick={openAdd} className={`${btnPrimary} ml-auto`}>+ Add item</button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-gray-200 bg-white p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" className="min-w-[180px] flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-green-600" />
        {["All", "Available", "OOS", "Featured"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-[12.5px] font-bold ${filter === f ? "bg-neutral-900 text-white" : "bg-gray-100"}`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title={items.length === 0 ? "No items yet — add your first!" : "No matches"} hint="Add items with a clear photo, honest weight and live stock so customers trust you." action={<button onClick={openAdd} className={btnPrimary}>+ Add item</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const oos = p.status === "oos";
            const busy = pendingIds.has(p.id);
            return (
              <div key={p.id} className={`overflow-hidden rounded-3xl border bg-white transition ${busy ? "opacity-60" : ""} ${oos ? "border-red-200" : "border-gray-200"}`}>
                <div className="flex gap-3 p-3.5">
                  <img src={p.imageUrl || ""} className={`h-20 w-20 shrink-0 rounded-2xl object-cover ${oos ? "grayscale" : ""}`} alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="truncate text-[14.5px] font-black">{p.name}</p>
                      {p.isFeatured && <Badge tone="amber">★</Badge>}
                    </div>
                    <p className="text-[12px] text-gray-500">{p.weight} · {p.category}</p>
                    <p className="mt-0.5 text-[15px] font-black">{inr(p.price)} <span className="text-[12px] font-bold text-gray-400 line-through">{p.mrp && Number(p.mrp) > Number(p.price) ? inr(p.mrp) : ""}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
                  <button onClick={() => quickPatch(p, { status: oos ? "available" : "oos" })} className={`rounded-full px-3 py-1.5 text-[11.5px] font-black ${oos ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
                    {oos ? "OOS · tap to restock" : `● Live · ${p.stockQty} left`}
                  </button>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => quickPatch(p, { stockQty: Math.max(0, p.stockQty - 1) })} className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm font-black ring-1 ring-gray-200">−</button>
                    <span className="w-8 text-center text-[12px] font-black">{p.stockQty}</span>
                    <button onClick={() => quickPatch(p, { stockQty: p.stockQty + 1 })} className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-900 text-sm font-black text-white">+</button>
                  </div>
                </div>
                <div className="flex gap-1.5 p-2.5">
                  <button onClick={() => openEdit(p)} className="flex-1 rounded-xl bg-gray-100 py-2 text-[12px] font-black hover:bg-gray-200">✏️ Edit</button>
                  <button onClick={() => quickPatch(p, { isFeatured: !p.isFeatured })} className="flex-1 rounded-xl bg-amber-50 py-2 text-[12px] font-black text-amber-800 hover:bg-amber-100">{p.isFeatured ? "★ Unfeature" : "☆ Feature"}</button>
                  <button onClick={() => remove(p)} className="flex-1 rounded-xl bg-red-50 py-2 text-[12px] font-black text-red-700 hover:bg-red-100">🗑 Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-black">{editing ? "✏️ Edit item" : "+ New item"}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full bg-gray-100 px-3 py-1.5 text-[13px] font-bold">✕</button>
            </div>
            <div className="mt-4 space-y-3.5">
              <div className="flex gap-3">
                <img src={form.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=60"} className="h-24 w-24 rounded-2xl border border-gray-200 object-cover" alt="" />
                <div className="flex-1 space-y-2">
                  <Field label="Photo URL">
                    <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://… or upload below" className={inputCls} />
                  </Field>
                  <label className="block cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-center text-[12.5px] font-bold text-gray-600 hover:bg-gray-100">
                    📤 Upload picture from device
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setForm({ ...form, imageUrl: await fileToDataUrl(f) });
                    }} />
                  </label>
                </div>
              </div>
              <Field label="Item name">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Desi Tomatoes" className={inputCls} />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Fresh, sorted, packed today…" className={inputCls} />
              </Field>
              <div className="grid grid-cols-3 gap-2.5">
                <Field label="Price ₹"><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" min={1} placeholder="42" className={inputCls} /></Field>
                <Field label="MRP ₹"><input value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} type="number" placeholder="60" className={inputCls} /></Field>
                <Field label="Weight"><input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="1 kg" className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Category">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Stock qty">
                  <input value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })} type="number" min={0} className={inputCls} />
                </Field>
              </div>
              <label className="flex items-center gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-900">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4" />
                ★ Feature on homepage (best sellers only)
              </label>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={`${btnGhost} flex-1`}>Cancel</button>
                <button onClick={save} disabled={saving || !form.name || !form.price} className={`${btnPrimary} flex-1`}>{saving ? "Saving…" : editing ? "Save changes" : "Add live →"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
