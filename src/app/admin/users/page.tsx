"use client";

import { useMemo, useState } from "react";
import { Trash2, Search } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { AdminHead, Panel } from "@/components/admin/AdminHead";
import { formatDateIst } from "@/lib/time";

type User = { id: string; name: string; email: string; phone: string | null; role: string; createdAt: string };
const ROLE_TONE: Record<string, "gray" | "green" | "amber" | "dark" | "purple"> = { customer: "gray", vendor: "green", wholesaler: "purple", admin: "dark" };

export default function AdminUsersPage() {
  const { data, loading, reload, setData } = useApi<{ users: User[] }>("/api/admin/users");
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.users ?? []).filter((u) => (role === "all" || u.role === role) && (!term || `${u.name} ${u.email}`.toLowerCase().includes(term)));
  }, [data, q, role]);

  const remove = async (u: User) => {
    if (!window.confirm(`Delete the account for ${u.email}?`)) return;
    setBusy(u.id);
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      setData((d) => (d ? { users: d.users.filter((x) => x.id !== u.id) } : d));
      toast("Account removed");
    } catch (e) {
      toast((e as Error).message, "error");
      await reload();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <AdminHead title="Users" body="All accounts. Stores and wholesalers are removed from their own pages in the admin section." />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="field !rounded-full pl-10" aria-label="Search users" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="field !w-auto !rounded-full">
          {["all", "customer", "vendor", "wholesaler", "admin"].map((r) => <option key={r} value={r}>{r === "all" ? "All roles" : r}</option>)}
        </select>
      </div>
      {loading && !data ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : rows.length === 0 ? (
        <Panel><EmptyState title="No accounts match" /></Panel>
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13.5px]">
            <thead className="border-b border-gray-100 text-[11.5px] font-black uppercase tracking-wider text-ink/45">
              <tr><th className="px-5 py-3">Name</th><th className="py-3">Email</th><th className="py-3">Phone</th><th className="py-3">Role</th><th className="py-3">Joined</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((u) => (
                <tr key={u.id} className={busy === u.id ? "opacity-60" : ""}>
                  <td className="px-5 py-3 font-bold">{u.name}</td>
                  <td className="py-3 text-ink/70">{u.email}</td>
                  <td className="py-3 text-ink/70">{u.phone ?? "—"}</td>
                  <td className="py-3"><Badge tone={ROLE_TONE[u.role] ?? "gray"}>{u.role}</Badge></td>
                  <td className="py-3 text-ink/55">{formatDateIst(u.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    {u.role === "customer" && <Button size="sm" variant="danger" onClick={() => remove(u)} disabled={busy === u.id}><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
