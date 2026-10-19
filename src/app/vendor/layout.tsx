"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Boxes, Clock, Receipt, MessageCircle, Wrench, Megaphone, Settings, LogOut, Store } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/ShopHeader";
import { EmptyState, Glass, Skeleton, StatusPill, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/vendor", label: "Overview", icon: LayoutDashboard },
  { href: "/vendor/inventory", label: "Inventory", icon: Boxes },
  { href: "/vendor/hours", label: "Open / close", icon: Clock },
  { href: "/vendor/bookings", label: "Bookings", icon: Receipt },
  { href: "/vendor/chats", label: "Chats", icon: MessageCircle },
  { href: "/vendor/services", label: "Services", icon: Wrench },
  { href: "/vendor/ads", label: "Ads", icon: Megaphone },
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
    return <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[260px_1fr]"><Skeleton className="hidden h-[70vh] lg:block" /><Skeleton className="h-[70vh]" /></div>;
  }

  if (!store) {
    return <Glass><EmptyState title="We couldn't find your shop" body="Please log out and log back in. If it still happens, contact support." action={<Button variant="soft" onClick={logout}>Log out</Button>} /></Glass>;
  }

  const isActive = (href: string) => (href === "/vendor" ? path === "/vendor" : path.startsWith(href));

  return (
    <div className="grid gap-6 lg:grid-cols-[264px_1fr] lg:gap-8">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Glass className="hidden !rounded-[28px] p-4 lg:block">
          <div className="mb-4 px-2"><Logo /></div>
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/60 p-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white">
              {store.dpUrl ? <img src={store.dpUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center"><Store className="h-5 w-5 text-ink/50" /></div>}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-extrabold">{store.shopName}</p>
              <StatusPill compact isOpen={store.isOpen} nextOpeningAt={store.nextOpeningAt} nextClosingAt={store.nextClosingAt} />
            </div>
          </div>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-bold transition", isActive(n.href) ? "bg-ink text-white shadow-lg" : "text-ink/70 hover:bg-white/70 hover:text-ink")}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
          <button onClick={logout} className="mt-4 flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-bold text-ink/60 hover:bg-white/70">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </Glass>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition", isActive(n.href) ? "bg-ink text-white" : "glass-pill text-ink/70")}>
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </Link>
          ))}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
