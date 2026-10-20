"use client";

import { useState } from "react";
import { Pencil, Trash2, BadgeCheck } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Field, Modal, Skeleton } from "@/components/ui";
import { AdminHead, Panel } from "@/components/admin/AdminHead";

type Wh = { id: string; businessName: string; city: string; locality: string | null; rating: number; isVerified: boolean; ownerName: string; ownerEmail: string };

export default function AdminWholesalersPage() {
  const { data, loading, reload, setData } = useApi<{ wholesalers: Wh[] }>("/api/admin/wholesalers");
  const { toast } = useToast();
  const [editing, setEditing] = useState<Wh | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const patch = async (w: Wh, body: Record<string, unknown>) => {
    setBusy(w.id);
    try {
      await api(`/api/admin/wholesalers/${w.id}`, { method: "PATCH", json: body });
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (w: Wh) => {
    if (!window.confirm(`Delete ${w.businessName} and its catalog? Vendors' restock requests to them will be removed too.`)) return;
    setBusy(w.id);
    try {
      await api(`/api/admin/wholesalers/${w.id}`, { method: "DELETE" });
      setData((d) => (d ? { wholesalers: d.wholesalers.filter((x) => x.id !== w.id) } : d));
      toast("Wholesaler removed");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHead title="Wholesalers" body="Verify wholesalers and fix business names. Vendors see verified badges." />
      {loading && !data ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (data?.wholesalers.length ?? 0) === 0 ? (
        <Panel><EmptyState title="No wholesalers yet" /></Panel>
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {data!.wholesalers.map((w) => (
              <li key={w.id} className={`flex flex-wrap items-center gap-3 px-5 py-4 ${busy === w.id ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[14.5px] font-extrabold">{w.businessName} {w.isVerified && <BadgeCheck className="h-4 w-4 text-leaf-deep" />}</p>
                  <p className="truncate text-[12px] text-ink/55">{w.locality ?? "—"}, {w.city} · ★ {w.rating.toFixed(1)} · {w.ownerName} ({w.ownerEmail})</p>
                </div>
                <Badge tone={w.isVerified ? "green" : "amber"}>{w.isVerified ? "Verified" : "Not verified"}</Badge>
                <Button size="sm" variant="soft" onClick={() => patch(w, { isVerified: !w.isVerified })} disabled={busy === w.id}>{w.isVerified ? "Unverify" : "Verify"}</Button>
                <Button size="sm" variant="soft" onClick={() => { setEditing(w); setName(w.businessName); }}><Pencil className="h-3.5 w-3.5" /> Rename</Button>
                <Button size="sm" variant="danger" onClick={() => remove(w)} disabled={busy === w.id}><Trash2 className="h-3.5 w-3.5" /></Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Rename wholesaler" footer={<Button type="submit" form="wh-form">Save</Button>}>
          <form id="wh-form" onSubmit={async (e) => { e.preventDefault(); await patch(editing, { businessName: name }); setEditing(null); }}>
            <Field label="Business name"><input required value={name} onChange={(e) => setName(e.target.value)} className="field" /></Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
