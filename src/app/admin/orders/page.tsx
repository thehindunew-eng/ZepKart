"use client";

import { useApi } from "@/hooks/useApi";
import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { AdminHead, Panel } from "@/components/admin/AdminHead";
import { money } from "@/lib/utils";
import { formatDateTimeIst } from "@/lib/time";
import { STATUS_LABEL } from "@/lib/order-status";

type Order = { id: string; shopName: string; customerName: string; fulfillment: "pickup" | "delivery"; status: string; total: number; createdAt: string };

export default function AdminOrdersPage() {
  const { data, loading } = useApi<{ orders: Order[] }>("/api/admin/orders", { poll: 20000 });
  return (
    <div>
      <AdminHead title="Bookings" body="Latest 150 bookings across all stores. Stores update status from their dashboards." />
      {loading && !data ? (
        <Skeleton className="h-96" />
      ) : (data?.orders.length ?? 0) === 0 ? (
        <Panel><EmptyState title="No bookings yet" /></Panel>
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[13.5px]">
            <thead className="border-b border-gray-100 text-[11.5px] font-black uppercase tracking-wider text-ink/45">
              <tr><th className="px-5 py-3">Booking</th><th className="py-3">Store</th><th className="py-3">Customer</th><th className="py-3">Type</th><th className="py-3">Status</th><th className="py-3 text-right">Total</th><th className="px-5 py-3">Placed</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data!.orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-mono text-[12px]">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="py-3 font-bold">{o.shopName}</td>
                  <td className="py-3">{o.customerName}</td>
                  <td className="py-3 capitalize text-ink/70">{o.fulfillment}</td>
                  <td className="py-3"><Badge tone={o.status === "completed" ? "green" : o.status === "rejected" || o.status === "cancelled" ? "red" : "gray"}>{STATUS_LABEL[o.status] ?? o.status}</Badge></td>
                  <td className="py-3 text-right font-bold tabular-nums">{money(o.total)}</td>
                  <td className="px-5 py-3 text-ink/55">{formatDateTimeIst(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
