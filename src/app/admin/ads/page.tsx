"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { AdminHead, Panel } from "@/components/admin/AdminHead";
import { money, cn } from "@/lib/utils";
import { formatDateTimeIst } from "@/lib/time";

type AdRequest = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  durationSec: number;
  planDays: number;
  status: string;
  seasonName: string;
  total: number;
  gstAmount: number;
  rejectReason: string | null;
  endsAt: string | null;
  createdAt: string;
  requesterName: string;
  requesterCity: string | null;
  requesterType: "vendor" | "wholesaler";
};

const TABS = [
  { key: "requested", label: "Waiting for review" },
  { key: "active", label: "Live" },
  { key: "rejected", label: "Not approved" },
] as const;

export default function AdminAdsPage() {
  const { data, loading, reload } = useApi<{ requests: AdRequest[] }>("/api/admin/ads", { poll: 15000 });
  const { toast } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("requested");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const rows = useMemo(() => (data?.requests ?? []).filter((r) => r.status === tab), [data, tab]);
  const counts = useMemo(() => {
    const all = data?.requests ?? [];
    return { requested: all.filter((r) => r.status === "requested").length, active: all.filter((r) => r.status === "active").length, rejected: all.filter((r) => r.status === "rejected").length };
  }, [data]);

  const decide = async (r: AdRequest, action: "approve" | "reject") => {
    setBusy(r.id);
    try {
      await api(`/api/admin/ads/${r.id}`, { method: "PATCH", json: { action, reason: action === "reject" ? reason : undefined } });
      toast(action === "approve" ? "Ad is live and added to Featured" : "Request declined");
      setRejecting(null);
      setReason("");
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHead title="Ad requests" body="Paid requests from vendors and wholesalers. Approve to publish in Featured for the plan's days." />
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("btn3d rounded-full px-4 py-2 text-[13px] font-bold transition", tab === t.key ? "bg-ink text-white" : "bg-white text-ink/70 hover:bg-gray-100")}>
            {t.label} <span className="ml-1 opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : rows.length === 0 ? (
        <Panel><EmptyState title="Nothing here" body={tab === "requested" ? "New paid requests will show up here." : "No requests in this list."} /></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <Panel key={r.id} className="flex flex-col gap-4 p-4 sm:flex-row">
              <div className="relative aspect-[9/13] w-full shrink-0 overflow-hidden rounded-xl bg-black sm:w-32">
                <video src={r.videoUrl} muted preload="metadata" className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10.5px] font-bold text-white">{r.durationSec}s</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.status === "active" ? "green" : r.status === "rejected" ? "red" : "dark"}>{r.status === "requested" ? "Waiting" : r.status === "active" ? "Live" : "Declined"}</Badge>
                  <Badge tone="gray">{r.requesterType === "vendor" ? "Vendor" : "Wholesaler"}</Badge>
                </div>
                <p className="text-[15px] font-extrabold leading-snug">{r.title}</p>
                <p className="text-[12.5px] text-ink/60">{r.requesterName}{r.requesterCity ? ` · ${r.requesterCity}` : ""}</p>
                <p className="text-[12.5px] text-ink/60">{r.planDays} days · {r.seasonName}</p>
                <p className="text-[14px] font-black">{money(r.total)} <span className="text-[11.5px] font-semibold text-ink/50">incl. GST {money(r.gstAmount)}</span></p>
                {r.description && <p className="line-clamp-2 text-[12.5px] text-ink/60">{r.description}</p>}
                {r.status === "active" && r.endsAt && <p className="text-[12px] text-ink/55">Runs until {formatDateTimeIst(r.endsAt)}</p>}
                {r.status === "rejected" && r.rejectReason && <p className="text-[12.5px] font-semibold text-red-700">{r.rejectReason}</p>}
                <p className="text-[11.5px] text-ink/45">Requested {formatDateTimeIst(r.createdAt)}</p>

                {r.status === "requested" && rejecting !== r.id && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="gold" loading={busy === r.id} onClick={() => decide(r, "approve")}><CheckCircle2 className="h-3.5 w-3.5" /> Approve & publish</Button>
                    <Button size="sm" variant="soft" onClick={() => { setRejecting(r.id); setReason(""); }}><XCircle className="h-3.5 w-3.5" /> Decline</Button>
                  </div>
                )}
                {r.status === "requested" && rejecting === r.id && (
                  <div className="space-y-2 pt-1">
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason shown to the requester" className="field !py-2 !text-[13px]" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" loading={busy === r.id} onClick={() => decide(r, "reject")}>Decline request</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
