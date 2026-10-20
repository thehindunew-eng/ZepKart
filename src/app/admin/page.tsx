"use client";

import { useApi } from "@/hooks/useApi";
import { money } from "@/lib/utils";
import { AdminHead, Panel, StatCard } from "@/components/admin/AdminHead";
import { Skeleton } from "@/components/ui";

type Overview = { users: number; stores: number; wholesalers: number; ordersLast24h: number; pendingAdRequests: number; openTickets: number; payments: number; revenue: number };

export default function AdminOverview() {
  const { data, loading } = useApi<Overview>("/api/admin/overview", { poll: 20000 });
  return (
    <div>
      <AdminHead title="Overview" body="Live numbers across ZepKart. Changes here affect the whole app." />
      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Users" value={data.users} href="/admin/users" />
          <StatCard label="Stores" value={data.stores} href="/admin/stores" />
          <StatCard label="Wholesalers" value={data.wholesalers} href="/admin/wholesalers" />
          <StatCard label="Bookings (24h)" value={data.ordersLast24h} href="/admin/orders" />
          <StatCard label="Ad requests waiting" value={data.pendingAdRequests} href="/admin/ads" tone={data.pendingAdRequests > 0 ? "warn" : undefined} />
          <StatCard label="Open support tickets" value={data.openTickets} href="/admin/support" tone={data.openTickets > 0 ? "warn" : undefined} />
          <StatCard label="Ad payments" value={data.payments} />
          <StatCard label="Ad revenue (incl. GST)" value={money(data.revenue)} />
        </div>
      ) : null}
      <Panel className="mt-6 p-5">
        <p className="text-[14px] font-extrabold">Quick actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/admin/ads" className="btn3d rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white">Review ad requests</a>
          <a href="/admin/featured" className="btn3d rounded-full bg-leaf px-4 py-2 text-[13px] font-bold text-white">Edit featured clips</a>
          <a href="/admin/stores" className="btn3d rounded-full bg-gray-100 px-4 py-2 text-[13px] font-bold text-ink hover:bg-gray-200">Manage stores</a>
        </div>
      </Panel>
    </div>
  );
}
