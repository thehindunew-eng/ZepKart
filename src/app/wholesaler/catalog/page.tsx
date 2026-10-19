"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError, useApi } from "@/hooks/useApi";
import { Badge, Button, EmptyState, Field, Skeleton, Spinner, Switch } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { CATEGORIES, WEIGHT_UNITS } from "@/lib/ncr";
import { money } from "@/lib/utils";

type Item = { id: string; name: string; category: string; imageUrl: string | null; weightValue: number; weightUnit: string; weightLabel: string; price: number; moq: number; stockQty: number; grade: "A" | "B" | "C"; inStock: boolean };

const EMPTY = { name: "", category: "Grocery", weightValue: "1", weightUnit: "kg", price: "", moq: "1", stockQty: "100", grade: "A" as "A" | "B" | "C", inStock: true };

export default function WholesalerCatalog() {
  const { data, loading, reload, setData } = useApi<{ products: Item[] }>("/api/wholesaler/products");
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy("add");
    try {
      const r = await api<{ product: Item }>("/api/wholesaler/products", { json: { ...form, price: Number(form.price), weightValue: Number(form.weightValue), moq: Number(form.moq), stockQty: Number(form.stockQty) } });
      setData((d) => ({ products: [...(d?.products ?? []), r.product].sort((a, b) => a.name.localeCompare(b.name)) }));
      setForm(EMPTY);
      toast("Item added to your catalog");
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not add the item");
    } finally {
      setBusy(null);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      const r = await api<{ product: Item }>(`/api/wholesaler/products/${id}`, { method: "PATCH", json: body });
      setData((d) => ({ products: (d?.products ?? []).map((p) => (p.id === id ? r.product : p)) }));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not save", "error");
      reload();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from your catalog?`)) return;
    setBusy(id);
    try {
      await api(`/api/wholesaler/products/${id}`, { method: "DELETE" });
      setData((d) => ({ products: (d?.products ?? []).filter((p) => p.id !== id) }));
      toast("Item removed");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not remove", "error");
    } finally {
      setBusy(null);
    }
  };

  const items = data?.products ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-black tracking-tight">Catalog</h1>
        <p className="text-[13.5px] text-ink/55">Prices are per unit, excluding GST. Shops compare these when they restock.</p>
      </div>

      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Item name">
          <input required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Robusta Bananas" />
        </Field>
        <Field label="Category">
          <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Field label="Pack size">
            <input type="number" min={0} step="any" className="field" value={form.weightValue} onChange={(e) => setForm({ ...form, weightValue: e.target.value })} />
          </Field>
          <Field label="Unit">
            <select className="field" value={form.weightUnit} onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}>
              {WEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Price / unit (₹)">
          <input required type="number" min={0.01} step="0.01" className="field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </Field>
        <Field label="Min order (units)">
          <input type="number" min={1} className="field" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} />
        </Field>
        <Field label="Stock available">
          <input type="number" min={0} className="field" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
        </Field>
        <Field label="Quality grade">
          <select className="field" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value as "A" | "B" | "C" })}>
            <option value="A">A · premium</option>
            <option value="B">B · standard</option>
            <option value="C">C · economy</option>
          </select>
        </Field>
        <div className="flex items-end justify-between gap-3">
          <label className="flex items-center gap-2 text-[13px] font-bold">
            <Switch checked={form.inStock} onChange={(v) => setForm({ ...form, inStock: v })} label="In stock" /> In stock
          </label>
          <Button type="submit" variant="dark" loading={busy === "add"}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>
        {err && <p className="text-[12.5px] font-semibold text-red-700 sm:col-span-2 xl:col-span-4">{err}</p>}
      </form>

      {loading && !data ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <EmptyState title="Your catalog is empty" body="Add the items you sell. Shops see them when they compare prices." />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="hidden grid-cols-[2fr_1fr_0.9fr_0.8fr_0.8fr_0.6fr_auto] gap-3 border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-ink/50 md:grid">
            <span>Item</span>
            <span>Pack</span>
            <span>Price</span>
            <span>Min order</span>
            <span>Stock</span>
            <span>Grade</span>
            <span />
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((p) => (
              <div key={p.id} className="grid grid-cols-2 items-center gap-3 px-5 py-3 md:grid-cols-[2fr_1fr_0.9fr_0.8fr_0.8fr_0.6fr_auto]">
                <div className="col-span-2 min-w-0 md:col-span-1">
                  <p className="truncate text-[14px] font-bold">{p.name}</p>
                  <p className="text-[12px] text-ink/50">{p.category}</p>
                </div>
                <span className="text-[13px] text-ink/70">{p.weightLabel}</span>
                <PriceCell value={p.price} onSave={(v) => patch(p.id, { price: v })} disabled={busy === p.id} />
                <MoqCell value={p.moq} onSave={(v) => patch(p.id, { moq: v })} disabled={busy === p.id} />
                <StockCell value={p.stockQty} onSave={(v) => patch(p.id, { stockQty: v })} disabled={busy === p.id} />
                <select className="field !w-auto !py-1.5 !text-[13px]" value={p.grade} disabled={busy === p.id} onChange={(e) => patch(p.id, { grade: e.target.value })}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
                <div className="flex items-center justify-end gap-3">
                  <Switch checked={p.inStock} disabled={busy === p.id} onChange={(v) => patch(p.id, { inStock: v })} label={`${p.name} in stock`} />
                  <button onClick={() => remove(p.id, p.name)} disabled={busy === p.id} aria-label={`Remove ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-40">
                    {busy === p.id ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
                {!p.inStock && <Badge tone="gray" className="col-span-2 w-fit md:hidden">Hidden from shops</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-[12px] text-ink/50">Grade: A is premium, B standard, C economy.</p>
    </div>
  );
}

function PriceCell({ value, onSave, disabled }: { value: number; onSave: (v: number) => void; disabled: boolean }) {
  return <Inline value={value} display={money(value)} onSave={onSave} disabled={disabled} min={0.01} step="0.01" />;
}
function MoqCell({ value, onSave, disabled }: { value: number; onSave: (v: number) => void; disabled: boolean }) {
  return <Inline value={value} display={String(value)} onSave={onSave} disabled={disabled} min={1} step="1" />;
}
function StockCell({ value, onSave, disabled }: { value: number; onSave: (v: number) => void; disabled: boolean }) {
  return <Inline value={value} display={String(value)} onSave={onSave} disabled={disabled} min={0} step="1" />;
}

/** Click to edit a number. Saves on blur or Enter. */
function Inline({ value, display, onSave, disabled, min, step }: { value: number; display: string; onSave: (v: number) => void; disabled: boolean; min: number; step: string }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  if (!editing) {
    return (
      <button disabled={disabled} onClick={() => { setV(String(value)); setEditing(true); }} className="w-fit rounded-lg px-2 py-1 text-left text-[13.5px] font-semibold hover:bg-gray-100 disabled:opacity-50">
        {display}
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    const n = Number(v);
    if (Number.isFinite(n) && n >= min && n !== value) onSave(n);
  };
  return (
    <input
      autoFocus
      type="number"
      min={min}
      step={step}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="field !w-28 !py-1.5 !text-[13.5px]"
    />
  );
}
