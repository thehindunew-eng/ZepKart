"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, MessageCircle, Package, ShoppingBag, Search, LogOut, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { cn, initials } from "@/lib/utils";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-[#1f9a58] to-[#0d5f33] text-[19px] font-black text-white shadow-lg shadow-emerald-900/25">Z</span>
      <span className="leading-none">
        <span className="block text-[18px] font-black tracking-tight">
          ZepKart<span className="text-gold-500 text-[#e28b1c]">.</span>
        </span>
        <span className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-ink/50">NCR quick commerce</span>
      </span>
    </Link>
  );
}

export function ShopHeader() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const isVendor = user?.role === "vendor";

  const navItem = (href: string, label: string, icon: React.ReactNode, badge?: number) => (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-bold transition",
        pathname === href || (href !== "/" && pathname.startsWith(href)) ? "bg-ink text-white shadow-md" : "text-ink/75 hover:bg-white/70",
      )}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
      {!!badge && <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-[#e28b1c] px-1 text-[10px] font-black text-white">{badge}</span>}
    </Link>
  );

  return (
    <header className="glass sticky top-3 z-40 mx-3 mt-3 rounded-[26px] sm:mx-5">
      <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
        <Logo />
        <form
          className="ml-2 hidden flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <div className="relative mx-auto max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="field !rounded-full !py-2.5 pl-10" placeholder="Search atta, paneer, veggies…" aria-label="Search items" />
          </div>
        </form>
        <nav className="ml-auto flex items-center gap-1">
          {!isVendor && navItem("/orders", "Orders", <Package className="h-4 w-4" />)}
          {!isVendor && navItem("/chats", "Chats", <MessageCircle className="h-4 w-4" />)}
          {isVendor && navItem("/vendor", "Dashboard", <LayoutDashboard className="h-4 w-4" />)}
          {!isVendor && (
            <Link href="/cart" className="relative flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-2 text-[13.5px] font-bold text-ink shadow-sm hover:bg-white">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Basket</span>
              {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-700 px-1.5 text-[11px] font-black text-white">{count}</span>}
            </Link>
          )}
          {loading ? (
            <div className="ml-1 h-9 w-9 animate-pulse rounded-full bg-white/70" />
          ) : user ? (
            <div className="relative ml-1">
              <button onClick={() => setMenu((m) => !m)} aria-label="Account menu" aria-expanded={menu} className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-white/90 bg-gradient-to-br from-amber-200 to-emerald-200 text-[13px] font-black text-ink shadow-sm">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
              </button>
              {menu && (
                <div className="glass-strong rise absolute right-0 top-12 z-50 w-56 rounded-2xl p-2 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="text-[13.5px] font-extrabold">{user.name}</p>
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink/50">{isVendor ? "Vendor" : "Customer"}</p>
                  </div>
                  {isVendor && <Link href="/vendor" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold hover:bg-white/80"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>}
                  {!isVendor && <Link href="/orders" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold hover:bg-white/80"><Package className="h-4 w-4" /> My bookings</Link>}
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-red-700 hover:bg-red-50/80"><LogOut className="h-4 w-4" /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth" className="ml-1 inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-bold text-white shadow-md">
              <User className="h-4 w-4" /> Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useCart();
  if (user?.role === "vendor") return null;
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/orders", label: "Bookings", icon: Package },
    { href: "/cart", label: "Basket", icon: ShoppingBag, badge: count },
    { href: "/chats", label: "Chats", icon: MessageCircle },
  ];
  return (
    <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[24px] p-1.5 lg:hidden">
      {tabs.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={cn("relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-bold", active ? "bg-ink text-white" : "text-ink/70")}>
            <t.icon className="h-5 w-5" />
            {t.label}
            {!!t.badge && <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e28b1c] px-1 text-[10px] font-black text-white">{t.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
