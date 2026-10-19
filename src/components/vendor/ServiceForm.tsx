"use client";

import { useState } from "react";
import { Modal, Field, Button, Switch } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { api } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { GST_RATES } from "@/lib/ncr";
import type { VService } from "@/components/vendor/useVendorData";

type Props = { open: boolean; onClose: () => void; initial: VService | null; onSaved: (s: VService) => void };

/** Mounts the form fresh each time it opens, so fields always start from the service. */
export function ServiceForm(props: Props) {
  if (!props.open) return null;
  return <ServiceFormBody {...props} />;
}

function initialForm(initial: VService | null) {
  return initial
    ? { title: initial.title, description: initial.description ?? "", imageUrl: initial.imageUrl, price: String(initial.price), unitLabel: initial.unitLabel, gstRate: String(initial.gstRate), isActive: initial.isActive }
    : { title: "", description: "", imageUrl: null as string | null, price: "", unitLabel: "per booking", gstRate: "18", isActive: true };
}

function ServiceFormBody({ onClose, initial, onSaved }: Props) {
  const [f, setF] = useState(() => initialForm(initial));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { toast } = useToast();

  const save = async () => {
    const body = { title: f.title.trim(), description: f.description.trim() || null, imageUrl: f.imageUrl, price: Number(f.price), unitLabel: f.unitLabel.trim() || "per booking", gstRate: Number(f.gstRate), isActive: f.isActive };
    setBusy(true);
    setErr(null);
    try {
      const r = initial
        ? await api<{ service: VService }>(`/api/vendor/services/${initial.id}`, { method: "PATCH", json: body })
        : await api<{ service: VService }>("/api/vendor/services", { json: body });
      onSaved(r.service);
      toast(initial ? "Service updated" : "Service added");
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit service" : "New service"}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!f.title.trim() || !f.price} onClick={save}>{initial ? "Save" : "Add service"}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <ImageUpload value={f.imageUrl} onChange={(u) => setF({ ...f, imageUrl: u })} label="Picture" />
        <div className="grid gap-4">
          <Field label="Title"><input className="field" value={f.title} maxLength={160} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Description"><textarea className="field min-h-[64px]" maxLength={600} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (₹)"><input className="field" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
            <Field label="Charged"><input className="field" value={f.unitLabel} maxLength={60} onChange={(e) => setF({ ...f, unitLabel: e.target.value })} /></Field>
            <Field label="GST">
              <select className="field" value={f.gstRate} onChange={(e) => setF({ ...f, gstRate: e.target.value })}>
                {GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}
              </select>
            </Field>
          </div>
          <Switch checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} label={f.isActive ? "Show to customers" : "Hidden"} />
          {err && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-2.5 text-[13px] font-semibold text-red-800">{err}</p>}
        </div>
      </div>
    </Modal>
  );
}
