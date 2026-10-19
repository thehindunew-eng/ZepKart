"use client";

import { useState } from "react";
import { api } from "@/hooks/useApi";
import { useAuth, type VendorStore } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Switch } from "@/components/ui";
import { storeStatusText } from "@/lib/time";
import { cn } from "@/lib/utils";

/** Live open/closed switch. Updates immediately and rolls back if the server rejects it. */
export function StatusToggle({ store, big = false }: { store: VendorStore; big?: boolean }) {
  const { setStore } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const toggle = async (next: boolean) => {
    const prev = store;
    setStore({ ...store, isOpen: next, nextOpeningAt: next ? null : store.nextOpeningAt, nextClosingAt: next ? store.nextClosingAt : null });
    setPending(true);
    try {
      const r = await api<{ store: VendorStore }>("/api/vendor/status", { method: "PATCH", json: { isOpen: next } });
      setStore(r.store);
      toast(next ? "Your shop is open" : "Your shop is closed");
    } catch (e) {
      setStore(prev);
      toast((e as Error).message, "error");
    } finally {
      setPending(false);
    }
  };
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-3xl p-4", big ? "glass-strong p-5" : "bg-white/50")}>
      <div className="min-w-0">
        <p className={cn("font-black tracking-tight", big ? "text-[22px]" : "text-[15px]")}>{store.isOpen ? "Open for orders" : "Closed"}</p>
        <p className="text-[12.5px] text-ink/60">{storeStatusText(store)}</p>
      </div>
      <Switch checked={store.isOpen} disabled={pending} onChange={toggle} label={store.isOpen ? "Open" : "Closed"} />
    </div>
  );
}
