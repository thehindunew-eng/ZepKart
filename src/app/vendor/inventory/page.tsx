"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Lock } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { useVendorGate, type VProduct } from "@/components/vendor/useVendorData";
import { ProductForm } from "@/components/vendor/ProductForm";
import { Badge, Button, EmptyState, Glass, Modal, ProductImage, Skeleton, Stepper, Switch } from "@/components/ui";
import { money, cn } from "@/lib/utils";

type Filter = "all" | "in" | "out" | "low";

export default function InventoryPage() {
  const gate = useVendorGate();
  const { data, setData, loading, reload } = useApi<{ products: VProduct[] }>(gate.ready ? "/api/vendor/products" : null, { poll: 8000 });
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<VProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<VProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const patchLocal = (id: string, change: Partial<VProduct>) =>
    setData((d) => (d ? { products: d.products.map((p) => (p.id === id ? { ...p, ...change } : p)) } : d));

  /** Optimistic update: show the change at once, then save. Roll back on failure. */
  const update = async (p: VProduct, change: Partial<VProduct>, body: Record<string, unknown>) => {
    patchLocal(p.id, change);
    try {
      await api(`/api/vendor/products/${p.id}`, { method: "PATCH", json: body });
    } catch (e) {
      patchLocal(p.id, { inStock: p.inStock, stockQty: p.stockQty, available: p.available });
      toast((e as Error).message, "error");
    }
  };

  const toggleStock = (p: VProduct, inStock: boolean) => update(p, { inStock, available: inStock && p.stockQty > 0 }, { inStock });
  const setQty = (p: VProduct, stockQty: number) => update(p, { stockQty, available: p.inStock && stockQty > 0, stockLeft: stockQty <= 5 ? stockQty : null }, { stockQty });

  const remove = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await api(`/api/vendor/products/${confirmDel.id}`, { method: "DELETE" });
      setData((d) => (d ? { products: d.products.filter((p) => p.id !== confirmDel.id) } : d));
      toast("Item removed");
      setConfirmDel(null);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const all = data?.products ?? [];
  const low = (p: VProduct) => p.inStock && p.stockQty > 0 && p.stockQty <= 5;
  const shown = all
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => (filter === "in" ? p.inStock && p.stockQty > 0 : filter === "out" ? !p.inStock || p.stockQty === 0 : filter === "low" ? low(p) : true));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-black tracking-tight">Inventory</h1>
          <p className="text-[14px] text-ink/55">{all.length} items · {all.filter((p) => p.inStock && p.stockQty > 0).length} in stock</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add item</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input className="field !rounded-full pl-10" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
        </div>
        <div className="glass-pill flex rounded-full p-1 text-[12.5px] font-bold">
          {(["all", "in", "low", "out"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-3 py-1.5 capitalize transition", filter === f ? "bg-ink text-white" : "text-ink/65")}>
              {f === "all" ? "All" : f === "in" ? "In stock" : f === "low" ? "Low" : "Out"}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : all.length === 0 ? (
        <Glass><EmptyState title="Your shelf is empty" body="Add your first item with a picture, price and stock count. Customers see it right away." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add first item</Button>} /></Glass>
      ) : shown.length === 0 ? (
        <Glass><EmptyState title="Nothing matches" body="Try a different search or filter." /></Glass>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <Glass key={p.id} className={cn("rise flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap sm:p-4", !p.inStock && "opacity-80")}>
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/60">
                <ProductImage src={p.imageUrl} category={p.category} alt={p.name} />
              </div>
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-[15px] font-extrabold">{p.name}</p>
                <p className="truncate text-[12.5px] text-ink/55">{p.category} · {p.weightLabel} · GST {p.gstRate}%</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[14px] font-black tabular-nums">{money(p.price)}</span>
                  {p.mrp > p.price && <span className="text-[12px] text-ink/40 line-through">{money(p.mrp)}</span>}
                  {p.bargainEnabled && <Badge tone="gold"><Lock className="h-3 w-3" /> Floor {money(p.floorPrice)}</Badge>}
                  {low(p) && <Badge tone="amber">Low stock</Badge>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-ink/50">Qty</p>
                  <Stepper value={p.stockQty} min={0} max={100000} size="sm" onChange={(v) => setQty(p, v)} />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink/50">{p.inStock ? "In stock" : "Out"}</p>
                  <Switch checked={p.inStock} onChange={(v) => toggleStock(p, v)} label={p.inStock ? "In stock" : "Out of stock"} />
                </div>
                <div className="flex gap-1.5">
                  <button aria-label={`Edit ${p.name}`} onClick={() => { setEditing(p); setFormOpen(true); }} className="grid h-9 w-9 place-items-center rounded-full bg-white/70 hover:bg-white"><Pencil className="h-4 w-4" /></button>
                  <button aria-label={`Delete ${p.name}`} onClick={() => setConfirmDel(p)} className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Glass>
          ))}
        </div>
      )}

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={(saved, created) => {
          if (created) reload();
          else setData((d) => (d ? { products: d.products.map((p) => (p.id === saved.id ? saved : p)) } : d));
        }}
      />

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Remove this item?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDel(null)}>Keep it</Button>
            <Button variant="danger" loading={deleting} onClick={remove}>Remove</Button>
          </>
        }
      >
        <p className="text-[14px] text-ink/70">{confirmDel?.name} will disappear from your store and from search. Past bookings keep their record.</p>
      </Modal>
    </div>
  );
}
