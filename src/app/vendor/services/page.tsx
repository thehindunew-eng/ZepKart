"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { useVendorGate, type VService } from "@/components/vendor/useVendorData";
import { ServiceForm } from "@/components/vendor/ServiceForm";
import { Button, EmptyState, Glass, Modal, Skeleton, Switch } from "@/components/ui";
import { money, cn } from "@/lib/utils";

export default function ServicesPage() {
  const gate = useVendorGate();
  const { data, setData, loading, reload } = useApi<{ services: VService[] }>(gate.ready ? "/api/vendor/services" : null, { poll: 15000 });
  const { toast } = useToast();
  const [editing, setEditing] = useState<VService | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<VService | null>(null);
  const [deleting, setDeleting] = useState(false);

  const list = data?.services ?? [];

  const toggle = async (s: VService, isActive: boolean) => {
    setData((d) => (d ? { services: d.services.map((x) => (x.id === s.id ? { ...x, isActive } : x)) } : d));
    try {
      await api(`/api/vendor/services/${s.id}`, { method: "PATCH", json: { isActive } });
    } catch (e) {
      setData((d) => (d ? { services: d.services.map((x) => (x.id === s.id ? { ...x, isActive: s.isActive } : x)) } : d));
      toast((e as Error).message, "error");
    }
  };

  const remove = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await api(`/api/vendor/services/${confirmDel.id}`, { method: "DELETE" });
      setData((d) => (d ? { services: d.services.filter((x) => x.id !== confirmDel.id) } : d));
      toast("Service removed");
      setConfirmDel(null);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-black tracking-tight">Services</h1>
          <p className="text-[14px] text-ink/55">Extra services customers can add to their booking.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add service</Button>
      </div>

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : list.length === 0 ? (
        <Glass><EmptyState icon={<Wrench className="h-6 w-6" />} title="No services yet" body="Gift wrap, delivery slots, cake boxes or anything else you offer." action={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Add a service</Button>} /></Glass>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <Glass key={s.id} className={cn("rise flex flex-col gap-3 p-5", !s.isActive && "opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-extrabold">{s.title}</p>
                  <p className="text-[13px] font-black">{money(s.price)} <span className="text-[12px] font-semibold text-ink/50">{s.unitLabel} · GST {s.gstRate}%</span></p>
                </div>
                <Switch checked={s.isActive} onChange={(v) => toggle(s, v)} label={s.isActive ? "Shown" : "Hidden"} />
              </div>
              {s.description && <p className="line-clamp-2 text-[13px] text-ink/60">{s.description}</p>}
              <div className="mt-auto flex gap-2">
                <Button variant="soft" size="sm" onClick={() => { setEditing(s); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDel(s)}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
              </div>
            </Glass>
          ))}
        </div>
      )}

      <ServiceForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} onSaved={() => reload()} />

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Remove this service?"
        footer={<><Button variant="ghost" onClick={() => setConfirmDel(null)}>Keep it</Button><Button variant="danger" loading={deleting} onClick={remove}>Remove</Button></>}
      >
        <p className="text-[14px] text-ink/70">{confirmDel?.title} will no longer be offered to customers.</p>
      </Modal>
    </div>
  );
}
