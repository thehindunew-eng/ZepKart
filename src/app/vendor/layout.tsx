"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Boxes, Clock, Receipt, MessageCircle, Wrench, Megaphone, Settings, LogOut, Store, Warehouse, Crown, Truck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/ShopHeader";
import { EmptyState, Skeleton, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/vendor", label: "Overview", icon: LayoutDashboard },
  { href: "/vendor/inventory", label: "Inventory", icon: Boxes },
  { href: "/vendor/restock", label: "Restock", icon: Truck },
  { href: "/vendor/wholesalers", label: "Wholesalers", icon: Warehouse },
  { href: "/vendor/hours", label: "Open / close", icon: Clock },
  { href: "/vendor/bookings", label: "Bookings", icon: Receipt },
  { href: "/vendor/chats", label: "Chats", icon: MessageCircle },
  { href: "/vendor/services", label: "Services", icon: Wrench },
  { href: "/vendor/ads", label: "Ads", icon: Megaphone },
  { href: "/vendor/plan", label: "Plan", icon: Crown },
  { href: "/vendor/settings", label: "Shop settings", icon: Settings },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, store, loading, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth?next=/vendor");
    else if (user.role !== "vendor") router.replace("/");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "vendor") {
    return (
      <div className="grid min-h-[70vh] gap-6 lg:grid-cols-[264px_1fr]">
        <Skeleton className="hidden h-[70vh] lg:block" />
        <Skeleton className="h-[70vh]" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white">
        <EmptyState title="We couldn't find your shop" body="Please log out and log back in. If it still happens, contact support." action={<Button variant="soft" onClick={logout}>Log out</Button>} />
      </div>
    );
  }

  const isActive = (href: string) => (href === "/vendor" ? path === "/vendor" : path.startsWith(href));
  const premium = store.plan === "premium";

  return (
    <div className="grid gap-6 lg:grid-cols-[264px_1fr] lg:gap-8">
      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white lg:block">
          <div className="bg-gradient-to-br from-[#052e16] via-leaf-deep to-leaf p-5 text-white">
            <div className="mb-4">
              <Logo />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-white/30 bg-white/10">
                {store.dpUrl ? <img src={store.dpUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><Store className="h-5 w-5" /></div>}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-black">{store.shopName}</p>
                <p className="text-[11.5px] text-white/75">{user.name}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-black tracking-wide", store.isOpen ? "bg-white text-leaf-deep" : "bg-black/30 text-white")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", store.isOpen ? "bg-leaf live-dot" : "bg-red-400")} />
                {store.isOpen ? "OPEN" : "CLOSED"}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black", premium ? "bg-gold text-ink" : "bg-white/15 text-white")}>
                {premium && <Crown className="h-3 w-3" />}
                {premium ? "PREMIUM" : "BASIC"}
              </span>
            </div>
          </div>
          <nav className="p-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition", isActive(n.href) ? "bg-leaf/10 text-leaf-deep" : "text-ink/70 hover:bg-gray-50 hover:text-ink")}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-1 border-t border-gray-100 p-2">
            <Link href={`/stores/${store.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-ink/60 hover:bg-gray-50">
              <Store className="h-4 w-4" /> View public store
            </Link>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-ink/60 hover:bg-gray-50">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition", isActive(n.href) ? "bg-ink text-white" : "border border-gray-200 bg-white text-ink/70")}>
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </Link>
          ))}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
