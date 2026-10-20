"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Package, ShoppingBag, LogOut, LayoutDashboard, Warehouse, ChevronDown, User, LifeBuoy, ShieldCheck, Store, Home, Boxes } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { SearchBox } from "@/components/SearchBox";
import { cn, initials } from "@/lib/utils";

type MenuItem = { href: string; label: string; icon: React.ReactNode };

/** Menu items for the logo, by role. Every role can reach Profile and Contact. */
function menuFor(role: string | undefined, loggedIn: boolean): MenuItem[] {
  const contact: MenuItem = { href: "/contact", label: "Contact ZepKart", icon: <LifeBuoy className="h-4 w-4" /> };
  const profile: MenuItem = { href: "/profile", label: "Profile", icon: <User className="h-4 w-4" /> };
  if (!loggedIn) return [{ href: "/", label: "Browse stores", icon: <Home className="h-4 w-4" /> }, { href: "/auth", label: "Log in or sign up", icon: <User className="h-4 w-4" /> }, contact];
  if (role === "vendor")
    return [
      profile,
      { href: "/vendor", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { href: "/vendor/bookings", label: "Bookings", icon: <Package className="h-4 w-4" /> },
      { href: "/vendor/chats", label: "Chats", icon: <MessageCircle className="h-4 w-4" /> },
      contact,
    ];
  if (role === "wholesaler")
    return [
      profile,
      { href: "/wholesaler", label: "Requests & quotes", icon: <Warehouse className="h-4 w-4" /> },
      { href: "/wholesaler/catalog", label: "My catalog", icon: <Boxes className="h-4 w-4" /> },
      contact,
    ];
  if (role === "admin")
    return [profile, { href: "/admin", label: "Admin console", icon: <ShieldCheck className="h-4 w-4" /> }, contact];
  return [
    profile,
    { href: "/orders", label: "My orders", icon: <Package className="h-4 w-4" /> },
    { href: "/chats", label: "Chats", icon: <MessageCircle className="h-4 w-4" /> },
    { href: "/", label: "Browse stores", icon: <Store className="h-4 w-4" /> },
    contact,
  ];
}

/** ZepKart logo. Click to open the menu (profile, orders, contact and more). */
export function Logo() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = menuFor(user?.role, !!user);

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="ZepKart menu" className="no-3d flex items-center gap-2 rounded-xl py-1 pr-2 hover:bg-gray-50">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-[17px] font-black text-white">Z</span>
        <span className="hidden text-[19px] font-black tracking-tight sm:inline">
          Zep<span className="text-leaf">Kart</span>
        </span>
        <ChevronDown className={cn("hidden h-3.5 w-3.5 text-ink/50 transition sm:block", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <button aria-label="Close menu" className="no-3d fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
            {user && (
              <div className="px-3 py-2">
                <p className="truncate text-[13.5px] font-extrabold">{user.name}</p>
                <p className="truncate text-[11.5px] font-semibold uppercase tracking-wider text-ink/50">{user.role}</p>
              </div>
            )}
            {items.map((it) => (
              <Link key={it.href + it.label} href={it.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink hover:bg-gray-50">
                {it.icon}
                {it.label}
              </Link>
            ))}
            {user && (
              <button onClick={() => { setOpen(false); logout(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ShopHeader() {
  const { user, wholesaler, loading, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const role = user?.role;
  const isVendor = role === "vendor";
  const isWholesaler = role === "wholesaler";
  const isAdmin = role === "admin";
  const isCustomer = !isVendor && !isWholesaler && !isAdmin;

  const navItem = (href: string, label: string, icon: React.ReactNode) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={cn("btn3d flex items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-bold transition", active ? "bg-ink text-white" : "bg-transparent text-ink/70 hover:bg-gray-100")}
      >
        {icon}
        <span className="hidden xl:inline">{label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Logo />

        {isCustomer && (
          <SearchBox className="hidden flex-1 md:block" inputClassName="mx-auto block max-w-xl" />
        )}

        <nav className="ml-auto flex items-center gap-1">
          {isCustomer && navItem("/orders", "Orders", <Package className="h-4 w-4" />)}
          {isCustomer && navItem("/chats", "Chats", <MessageCircle className="h-4 w-4" />)}
          {isVendor && navItem("/vendor", "Dashboard", <LayoutDashboard className="h-4 w-4" />)}
          {isWholesaler && navItem("/wholesaler", "Wholesale", <Warehouse className="h-4 w-4" />)}
          {isAdmin && navItem("/admin", "Admin", <ShieldCheck className="h-4 w-4" />)}
          {isCustomer && (
            <Link href="/cart" className="btn3d relative flex items-center gap-2 rounded-full bg-gray-100 px-3.5 py-2 text-[13.5px] font-bold text-ink hover:bg-gray-200">
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
                  <button aria-label="Close menu" className="no-3d fixed inset-0 z-40 cursor-default" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
                    <div className="px-3 py-2">
                      <p className="truncate text-[13.5px] font-extrabold">{user.name}</p>
                      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-ink/50">
                        {isVendor ? "Vendor" : isWholesaler ? `Wholesaler · ${wholesaler?.businessName ?? ""}` : isAdmin ? "Admin" : "Customer"}
                      </p>
                    </div>
                    <MenuLink href="/profile" label="Profile" icon={<User className="h-4 w-4" />} onDone={() => setMenu(false)} />
                    {isVendor && <MenuLink href="/vendor" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onDone={() => setMenu(false)} />}
                    {isWholesaler && <MenuLink href="/wholesaler" label="Requests & quotes" icon={<Warehouse className="h-4 w-4" />} onDone={() => setMenu(false)} />}
                    {isAdmin && <MenuLink href="/admin" label="Admin console" icon={<ShieldCheck className="h-4 w-4" />} onDone={() => setMenu(false)} />}
                    {isCustomer && <MenuLink href="/orders" label="My orders" icon={<Package className="h-4 w-4" />} onDone={() => setMenu(false)} />}
                    <MenuLink href="/contact" label="Contact ZepKart" icon={<LifeBuoy className="h-4 w-4" />} onDone={() => setMenu(false)} />
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth" className="btn3d ml-1 inline-flex h-10 items-center rounded-full bg-ink px-5 text-[13.5px] font-bold text-white hover:bg-gray-800">
              Log in
            </Link>
          )}
        </nav>
      </div>
      {isCustomer && (
        <div className="px-4 pb-3 md:hidden">
          <SearchBox placeholder="Search items or stores" />
        </div>
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
