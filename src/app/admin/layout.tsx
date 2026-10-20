"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Megaphone, Film, Store, Warehouse, Users, Receipt, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/ShopHeader";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/ads", label: "Ad requests", icon: Megaphone },
  { href: "/admin/featured", label: "Featured clips", icon: Film },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/wholesalers", label: "Wholesalers", icon: Warehouse },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const path = usePathname();

  if (loading) return <Skeleton className="m-6 h-96" />;
  if (!user) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-gray-200 bg-white">
        <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="Admin login required" action={<Link href="/auth?next=/admin"><Button>Log in</Button></Link>} />
      </div>
    );
  }
  if (user.role !== "admin") {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-gray-200 bg-white">
        <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="This area is for ZepKart admins" body="Sign in with an admin account to continue." action={<Link href="/"><Button variant="soft">Back to ZepKart</Button></Link>} />
      </div>
    );
  }

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">Admin</span>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-2 text-[13px] font-bold text-ink/70 hover:bg-gray-200"><LogOut className="h-3.5 w-3.5" /> Log out</button>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-4 pb-3 sm:px-6">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("btn3d flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition", isActive(n.href) ? "bg-ink text-white" : "bg-white text-ink/70 hover:bg-gray-100")}>
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
