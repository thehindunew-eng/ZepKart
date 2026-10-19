"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Package, ShoppingBag, Search, LogOut, LayoutDashboard, Warehouse, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { cn, initials } from "@/lib/utils";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-[17px] font-black text-white">Z</span>
      <span className="text-[19px] font-black tracking-tight">
        Zep<span className="text-leaf">Kart</span>
      </span>
    </Link>
  );
}

export function ShopHeader() {
  const { user, wholesaler, loading, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const role = user?.role;
  const isVendor = role === "vendor";
  const isWholesaler = role === "wholesaler";
  const isCustomer = !isVendor && !isWholesaler;

  const navItem = (href: string, label: string, icon: React.ReactNode) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={cn("flex items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-bold transition", active ? "bg-ink text-white" : "text-ink/70 hover:bg-gray-100")}
      >
        {icon}
        <span className="hidden xl:inline">{label}</span>
      </Link>
    );
  };

  const homeHref = isWholesaler ? "/wholesaler" : isVendor ? "/vendor" : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link href={homeHref} className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-[17px] font-black text-white">Z</span>
          <span className="hidden text-[19px] font-black tracking-tight sm:inline">
            Zep<span className="text-leaf">Kart</span>
          </span>
        </Link>

        {isCustomer && (
          <form
            className="hidden flex-1 md:block"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <div className="relative mx-auto max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="field !rounded-xl !bg-gray-100 !py-2.5 pl-10" placeholder="Search atta, paneer, bananas…" aria-label="Search items" />
            </div>
          </form>
        )}

        <nav className="ml-auto flex items-center gap-1">
          {isCustomer && navItem("/orders", "Orders", <Package className="h-4 w-4" />)}
          {isCustomer && navItem("/chats", "Chats", <MessageCircle className="h-4 w-4" />)}
          {isVendor && navItem("/vendor", "Dashboard", <LayoutDashboard className="h-4 w-4" />)}
          {isWholesaler && navItem("/wholesaler", "Wholesale", <Warehouse className="h-4 w-4" />)}
          {isCustomer && (
            <Link href="/cart" className="relative flex items-center gap-2 rounded-full bg-gray-100 px-3.5 py-2 text-[13.5px] font-bold text-ink hover:bg-gray-200">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Basket</span>
              {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1.5 text-[11px] font-black text-white">{count}</span>}
            </Link>
          )}
          {loading ? (
            <div className="ml-1 h-9 w-9 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <div className="relative ml-1">
              <button onClick={() => setMenu((m) => !m)} aria-label="Account menu" aria-expanded={menu} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2.5 hover:bg-gray-50">
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-leaf/10 text-[12px] font-black text-leaf-deep">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink/50" />
              </button>
              {menu && (
                <>
                  <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
                    <div className="px-3 py-2">
                      <p className="truncate text-[13.5px] font-extrabold">{user.name}</p>
                      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink/50">
                        {isVendor ? "Vendor" : isWholesaler ? `Wholesaler · ${wholesaler?.businessName ?? ""}` : "Customer"}
                      </p>
                    </div>
                    {isVendor && <MenuLink href="/vendor" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onDone={() => setMenu(false)} />}
                    {isWholesaler && <MenuLink href="/wholesaler" label="Requests & quotes" icon={<Warehouse className="h-4 w-4" />} onDone={() => setMenu(false)} />}
                    {isCustomer && <MenuLink href="/orders" label="My bookings" icon={<Package className="h-4 w-4" />} onDone={() => setMenu(false)} />}
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth" className="ml-1 inline-flex h-10 items-center rounded-full bg-ink px-5 text-[13.5px] font-bold text-white hover:bg-gray-800">
              Log in
            </Link>
          )}
        </nav>
      </div>
      {isCustomer && (
        <form
          className="px-4 pb-3 md:hidden"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="field !rounded-xl !bg-gray-100 !py-2.5 pl-10" placeholder="Search items or stores" aria-label="Search items" />
          </div>
        </form>
      )}
    </header>
  );
}

function MenuLink({ href, label, icon, onDone }: { href: string; label: string; icon: React.ReactNode; onDone: () => void }) {
  return (
    <Link href={href} onClick={onDone} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold hover:bg-gray-50">
      {icon}
      {label}
    </Link>
  );
}
