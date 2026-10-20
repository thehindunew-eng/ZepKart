"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { AdminHead, Panel } from "@/components/admin/AdminHead";
import { formatDateTimeIst } from "@/lib/time";
import { cn } from "@/lib/utils";

type Ticket = { id: string; name: string; contact: string; topic: string; orderRef: string | null; message: string; status: "open" | "resolved"; createdAt: string };
const TOPIC: Record<string, string> = { order: "Order", payment: "Payment", delivery: "Delivery", account: "Account", vendor: "Vendor", wholesale: "Wholesale", other: "Other" };

export default function AdminSupportPage() {
  const { data, loading, reload } = useApi<{ tickets: Ticket[] }>("/api/admin/support", { poll: 20000 });
  const { toast } = useToast();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [busy, setBusy] = useState<string | null>(null);
  const rows = useMemo(() => (data?.tickets ?? []).filter((t) => t.status === tab), [data, tab]);

  const set = async (t: Ticket, status: "open" | "resolved") => {
    setBusy(t.id);
    try {
      await api(`/api/admin/support/${t.id}`, { method: "PATCH", json: { status } });
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHead title="Support" body="Messages from the Contact form. Reply on the contact details shown." />
      <div className="mb-5 flex gap-2">
        {(["open", "resolved"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("btn3d rounded-full px-4 py-2 text-[13px] font-bold", tab === t ? "bg-ink text-white" : "bg-white text-ink/70 hover:bg-gray-100")}>
            {t === "open" ? "Open" : "Resolved"} <span className="ml-1 opacity-70">{(data?.tickets ?? []).filter((x) => x.status === t).length}</span>
          </button>
        ))}
      </div>
      {loading && !data ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : rows.length === 0 ? (
        <Panel><EmptyState title={tab === "open" ? "No open messages" : "Nothing resolved yet"} /></Panel>
      ) : (
        <div className="space-y-3">
          {rows.map((t) => (
            <Panel key={t.id} className={cn("p-5", busy === t.id && "opacity-60")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-extrabold">{t.name}</p>
                    <Badge tone="gray">{TOPIC[t.topic] ?? t.topic}</Badge>
                    {t.orderRef && <Badge tone="blue">Order {t.orderRef}</Badge>}
                  </div>
                  <p className="text-[12.5px] text-ink/55">{t.contact} · {formatDateTimeIst(t.createdAt)}</p>
                </div>
                {t.status === "open" ? (
                  <Button size="sm" variant="gold" onClick={() => set(t, "resolved")} disabled={busy === t.id}><CheckCircle2 className="h-3.5 w-3.5" /> Mark resolved</Button>
                ) : (
                  <Button size="sm" variant="soft" onClick={() => set(t, "open")} disabled={busy === t.id}><RotateCcw className="h-3.5 w-3.5" /> Reopen</Button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] text-ink/80">{t.message}</p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
