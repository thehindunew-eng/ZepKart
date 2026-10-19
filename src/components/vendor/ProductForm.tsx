"use client";

import { useState } from "react";
import { Modal, Field, Button, Switch } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { api } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { CATEGORIES, GST_RATES, WEIGHT_UNITS } from "@/lib/ncr";
import type { VProduct } from "@/components/vendor/useVendorData";

type Form = {
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  price: string;
  mrp: string;
  weightValue: string;
  weightUnit: string;
  stockQty: string;
  inStock: boolean;
  bargainEnabled: boolean;
  floorPrice: string;
  gstRate: string;
};

const empty: Form = { name: "", description: "", imageUrl: null, category: "Grocery", price: "", mrp: "", weightValue: "", weightUnit: "g", stockQty: "10", inStock: true, bargainEnabled: false, floorPrice: "", gstRate: "5" };

type Props = { open: boolean; onClose: () => void; initial: VProduct | null; onSaved: (p: VProduct, created: boolean) => void };

/** Mounts the form fresh each time it opens, so fields always start from the item. */
export function ProductForm(props: Props) {
  if (!props.open) return null;
  return <ProductFormBody {...props} />;
}

function initialForm(initial: VProduct | null): Form {
  return initial
    ? {
            name: initial.name,
            description: initial.description ?? "",
            imageUrl: initial.imageUrl,
            category: initial.category,
            price: String(initial.price),
            mrp: String(initial.mrp),
            weightValue: String(initial.weightValue),
            weightUnit: initial.weightUnit,
            stockQty: String(initial.stockQty),
            inStock: initial.inStock,
            bargainEnabled: initial.bargainEnabled,
            floorPrice: initial.floorPrice == null ? "" : String(initial.floorPrice),
            gstRate: String(initial.gstRate),
          }
    : empty;
}

function ProductFormBody({ onClose, initial, onSaved }: Props) {
  const [f, setF] = useState<Form>(() => initialForm(initial));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { toast } = useToast();

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    const price = Number(f.price);
    const mrp = f.mrp === "" ? price : Number(f.mrp);
    const body = {
      name: f.name.trim(),
      description: f.description.trim() || null,
      imageUrl: f.imageUrl,
      category: f.category,
      price,
      mrp,
      weightValue: Number(f.weightValue || 0),
      weightUnit: f.weightUnit,
      stockQty: Math.max(0, Math.floor(Number(f.stockQty) || 0)),
      inStock: f.inStock,
      bargainEnabled: f.bargainEnabled,
      floorPrice: f.bargainEnabled && f.floorPrice !== "" ? Number(f.floorPrice) : null,
      gstRate: Number(f.gstRate),
    };
    setBusy(true);
    setErr(null);
    try {
      if (initial) {
        const r = await api<{ product: VProduct }>(`/api/vendor/products/${initial.id}`, { method: "PATCH", json: body });
        onSaved(r.product, false);
        toast("Item updated");
      } else {
        const r = await api<{ product: VProduct }>("/api/vendor/products", { json: body });
        onSaved(r.product, true);
        toast("Item added to your shop");
      }
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const num = (k: keyof Form) => ({ value: f[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value as never), inputMode: "decimal" as const });

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit item" : "New item"}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={save} disabled={!f.name.trim() || !f.price}>{initial ? "Save changes" : "Add item"}</Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <ImageUpload value={f.imageUrl} onChange={(u) => set("imageUrl", u)} label="Picture" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Name"><input className="field" value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={160} /></Field></div>
          <Field label="Category">
            <select className="field" value={f.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="GST rate">
            <select className="field" value={f.gstRate} onChange={(e) => set("gstRate", e.target.value)}>
              {GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}
            </select>
          </Field>
          <Field label="Selling price (₹)" hint="Includes GST"><input className="field" {...num("price")} /></Field>
          <Field label="MRP (₹)" hint="Optional, shown struck through"><input className="field" {...num("mrp")} /></Field>
          <Field label="Weight">
            <div className="flex gap-2">
              <input className="field" {...num("weightValue")} />
              <select className="field !w-24" value={f.weightUnit} onChange={(e) => set("weightUnit", e.target.value)}>
                {WEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Stock quantity"><input className="field" inputMode="numeric" value={f.stockQty} onChange={(e) => set("stockQty", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea className="field min-h-[72px]" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={1000} /></Field></div>
          <div className="glass-strong flex items-center justify-between gap-3 rounded-2xl p-4 sm:col-span-2">
            <Switch checked={f.inStock} onChange={(v) => set("inStock", v)} label={f.inStock ? "In stock" : "Out of stock"} />
          </div>
          <div className="space-y-3 rounded-2xl border border-white/80 bg-white/40 p-4 sm:col-span-2">
            <Switch checked={f.bargainEnabled} onChange={(v) => set("bargainEnabled", v)} label="Accept offers in chat" />
            {f.bargainEnabled && (
              <Field label="Auto-accept at or above (₹)" hint="Private. Customers never see this price.">
                <input className="field" {...num("floorPrice")} />
              </Field>
            )}
          </div>
          {err && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-2.5 text-[13px] font-semibold text-red-800 sm:col-span-2">{err}</p>}
        </div>
      </div>
    </Modal>
  );
}
