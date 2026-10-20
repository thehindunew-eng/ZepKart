"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Search } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Field, Modal, Skeleton, Switch } from "@/components/ui";
import { AdminHead, Panel } from "@/components/admin/AdminHead";
import { money } from "@/lib/utils";

type Store = {
  id: string; shopName: string; city: string; locality: string | null; isOpen: boolean; plan: "basic" | "premium"; planExpiresAt: string | null;
  pickupAvailable: boolean; deliveryAvailable: boolean; deliveryFee: number; freeDeliveryAbove: number; minOrder: number; ownerName: string; ownerEmail: string;
};

export default function AdminStoresPage() {
  const { data, loading, reload, setData } = useApi<{ stores: Store[] }>("/api/admin/stores");
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Store | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.stores ?? []).filter((s) => !term || `${s.shopName} ${s.ownerName} ${s.locality ?? ""} ${s.city}`.toLowerCase().includes(term));
  }, [data, q]);

  const update = async (s: Store, body: Record<string, unknown>) => {
    setBusy(s.id);
    try {
      await api(`/api/admin/stores/${s.id}`, { method: "PATCH", json: body });
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (s: Store) => {
    if (!window.confirm(`Delete ${s.shopName}, its products and the owner account? This can't be undone.`)) return;
    setBusy(s.id);
    try {
      await api(`/api/admin/stores/${s.id}`, { method: "DELETE" });
      setData((d) => (d ? { stores: d.stores.filter((x) => x.id !== s.id) } : d));
      toast("Store removed");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHead
        title="Stores"
        body="Every vendor store. Change plan, open state and delivery terms here."
        right={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stores or owners" className="field !rounded-full pl-10" aria-label="Search stores" />
          </div>
        }
      />
      {loading && !data ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : rows.length === 0 ? (
        <Panel><EmptyState title="No stores match" body="Try a different search." /></Panel>
      ) : (
        <Panel className="overflow-hidden">
          <div className="hidden grid-cols-[2fr_1.4fr_1fr_1.1fr_auto] gap-4 border-b border-gray-100 px-5 py-3 text-[11.5px] font-black uppercase tracking-wider text-ink/45 md:grid">
            <span>Store</span><span>Owner</span><span>Open</span><span>Plan</span><span />
          </div>
          <ul className="divide-y divide-gray-100">
            {rows.map((s) => (
              <li key={s.id} className={`grid gap-3 px-5 py-4 md:grid-cols-[2fr_1.4fr_1fr_1.1fr_auto] md:items-center md:gap-4 ${busy === s.id ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-extrabold">{s.shopName}</p>
                  <p className="truncate text-[12px] text-ink/55">{s.locality ?? "—"}, {s.city} · {money(s.minOrder)} min · {money(s.deliveryFee)} delivery</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{s.ownerName}</p>
                  <p className="truncate text-[12px] text-ink/50">{s.ownerEmail}</p>
                </div>
                <div><Switch checked={s.isOpen} onChange={(v) => update(s, { isOpen: v })} disabled={busy === s.id} label={s.isOpen ? "Open" : "Closed"} /></div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={s.plan === "premium" ? "gold" : "gray"}>{s.plan === "premium" ? "Premium" : "Basic"}</Badge>
                  <button onClick={() => update(s, { plan: s.plan === "premium" ? "basic" : "premium" })} disabled={busy === s.id} className="text-[12px] font-bold text-ink/60 underline-offset-4 hover:underline">
                    {s.plan === "premium" ? "Downgrade" : "Make premium"}
                  </button>
                </div>
                <div className="flex gap-2 md:justify-end">
                  <Button size="sm" variant="soft" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(s)} disabled={busy === s.id}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {editing && <EditStore store={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await reload(); }} />}
    </div>
  );
}

function EditStore({ store, onClose, onSaved }: { store: Store; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ shopName: store.shopName, pickupAvailable: store.pickupAvailable, deliveryAvailable: store.deliveryAvailable, deliveryFee: String(store.deliveryFee), freeDeliveryAbove: String(store.freeDeliveryAbove), minOrder: String(store.minOrder) });
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/admin/stores/${store.id}`, { method: "PATCH", json: { ...f, deliveryFee: Number(f.deliveryFee), freeDeliveryAbove: Number(f.freeDeliveryAbove), minOrder: Number(f.minOrder) } });
      toast("Store updated");
      onSaved();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`Edit ${store.shopName}`} footer={<Button type="submit" form="store-form" loading={saving}>Save store</Button>}>
      <form id="store-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Shop name" className="sm:col-span-2"><input required value={f.shopName} onChange={(e) => setF({ ...f, shopName: e.target.value })} className="field" /></Field>
        <Field label="Delivery fee (₹)"><input type="number" min={0} value={f.deliveryFee} onChange={(e) => setF({ ...f, deliveryFee: e.target.value })} className="field" /></Field>
        <Field label="Free delivery above (₹)"><input type="number" min={0} value={f.freeDeliveryAbove} onChange={(e) => setF({ ...f, freeDeliveryAbove: e.target.value })} className="field" /></Field>
        <Field label="Minimum order (₹)"><input type="number" min={0} value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} className="field" /></Field>
        <div className="flex flex-col gap-3 pt-6">
          <Switch checked={f.pickupAvailable} onChange={(v) => setF({ ...f, pickupAvailable: v })} label="Pickup" />
          <Switch checked={f.deliveryAvailable} onChange={(v) => setF({ ...f, deliveryAvailable: v })} label="Delivery" />
        </div>
      </form>
    </Modal>
  );
}
