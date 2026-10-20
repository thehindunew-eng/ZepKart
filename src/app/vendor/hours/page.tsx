"use client";

import { useState } from "react";
import { api } from "@/hooks/useApi";
import { useAuth, type VendorStore } from "@/components/AuthProvider";
import { useVendorGate } from "@/components/vendor/useVendorData";
import { StatusToggle } from "@/components/vendor/StatusToggle";
import { useToast } from "@/components/Toast";
import { Button, Field, Glass, Skeleton } from "@/components/ui";
import { formatDateTimeIst, parseIstLocal, toIstLocal } from "@/lib/time";

export default function HoursPage() {
  const gate = useVendorGate();
  const { setStore } = useAuth();
  const { toast } = useToast();
  const [edited, setEdited] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const store = gate.store;
  // Until the vendor types something, show the saved time for the current state.
  const when = edited ?? toIstLocal(store ? (store.isOpen ? store.nextClosingAt : store.nextOpeningAt) : null);
  const setWhen = (v: string) => setEdited(v);

  if (!gate.ready || !store) return <Skeleton className="h-96" />;

  const save = async () => {
    const d = parseIstLocal(when);
    if (!d) return toast("Pick a date and time", "error");
    if (d.getTime() <= Date.now()) return toast("Pick a time in the future", "error");
    setBusy(true);
    try {
      const body = store.isOpen ? { nextClosingAt: d.toISOString() } : { nextOpeningAt: d.toISOString() };
      const r = await api<{ store: VendorStore }>("/api/vendor/status", { method: "PATCH", json: body });
      setStore(r.store);
      setEdited(null);
      toast(store.isOpen ? "Closing time saved" : "Opening time saved");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const clearSchedule = async () => {
    setBusy(true);
    try {
      const r = await api<{ store: VendorStore }>("/api/vendor/status", { method: "PATCH", json: store.isOpen ? { nextClosingAt: null } : { nextOpeningAt: null } });
      setStore(r.store);
      setEdited("");
      toast("Schedule cleared");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-black tracking-tight">Open / close</h1>
        <p className="text-[14px] text-ink/55">All times are IST. Your shop switches on its own at the time you set.</p>
      </div>

      <StatusToggle store={store} big />

      <Glass className="max-w-2xl space-y-5 p-6">
        <div className="grid gap-2 rounded-2xl bg-white/50 p-4 text-[13.5px] sm:grid-cols-2">
          <div><p className="text-[11.5px] font-bold uppercase tracking-wider text-ink/50">Next opening</p><p className="font-bold">{store.nextOpeningAt ? formatDateTimeIst(store.nextOpeningAt) : "Not scheduled"}</p></div>
          <div><p className="text-[11.5px] font-bold uppercase tracking-wider text-ink/50">Next closing</p><p className="font-bold">{store.nextClosingAt ? formatDateTimeIst(store.nextClosingAt) : "Not scheduled"}</p></div>
        </div>
        <Field label={store.isOpen ? "Close at (IST)" : "Open at (IST)"}>
          <input className="field" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button loading={busy} disabled={!when} onClick={save}>{store.isOpen ? "Save closing time" : "Save opening time"}</Button>
          <Button variant="ghost" disabled={busy} onClick={clearSchedule}>Clear schedule</Button>
        </div>
      </Glass>
    </div>
  );
}
