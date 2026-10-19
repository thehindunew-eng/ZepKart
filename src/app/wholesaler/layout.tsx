"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Inbox, Package, UserCog, LogOut, Warehouse } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/ShopHeader";
import { Skeleton, EmptyState, Button } from "@/components/ui";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/wholesaler", label: "Requests & quotes", icon: Inbox },
  { href: "/wholesaler/catalog", label: "Catalog", icon: Package },
  { href: "/wholesaler/profile", label: "Business profile", icon: UserCog },
];

export default function WholesalerLayout({ children }: { children: React.ReactNode }) {
  const { user, wholesaler, loading, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth?role=wholesaler&next=/wholesaler");
    else if (user.role !== "wholesaler") router.replace("/");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "wholesaler") {
    return (
      <div className="grid min-h-[70vh] gap-6 lg:grid-cols-[264px_1fr]">
        <Skeleton className="hidden h-[70vh] lg:block" />
        <Skeleton className="h-[70vh]" />
      </div>
    );
  }
  if (!wholesaler) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white">
        <EmptyState title="Business profile not found" body="Please log out and log back in." action={<Button variant="soft" onClick={logout}>Log out</Button>} />
      </div>
    );
  }

  const isActive = (href: string) => (href === "/wholesaler" ? path === "/wholesaler" : path.startsWith(href));

  return (
    <div className="grid gap-6 lg:grid-cols-[264px_1fr] lg:gap-8">
      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white lg:block">
          <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0c1222] p-5 text-white">
            <div className="mb-4">
              <Logo />
            </div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-white/25 bg-white/10 text-[15px] font-black">
                {initials(wholesaler.businessName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-black">{wholesaler.businessName}</p>
                <p className="text-[11.5px] text-white/70">
                  {wholesaler.locality}, {wholesaler.city}
                </p>
              </div>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-black tracking-wide">
              <Warehouse className="h-3 w-3" /> WHOLESALER · ★ {wholesaler.rating.toFixed(1)}
            </p>
          </div>
          <nav className="p-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-bold transition", isActive(n.href) ? "bg-leaf/10 text-leaf-deep" : "text-ink/70 hover:bg-gray-50 hover:text-ink")}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-100 p-2">
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
