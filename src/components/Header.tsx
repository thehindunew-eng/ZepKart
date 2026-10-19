"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const { user, store, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const isVendor = user?.role === "vendor";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 glass">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-700 text-xl font-black text-white shadow-lg shadow-green-700/30">
            Z
          </span>
          <span className="leading-none">
            <span className="block text-[18px] font-black tracking-tight">
              ZapKart<span className="text-green-700">.</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Live Bazaar</span>
          </span>
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-xl">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                onSearch?.(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/?q=${encodeURIComponent(q)}`);
              }}
              placeholder='Search "atta", "milk", "bananas"...'
              className="w-full rounded-2xl border border-gray-200 bg-white/80 py-2.5 pl-10 pr-4 text-[14px] outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10"
            />
          </div>
        </div>

        <nav className="ml-auto hidden items-center gap-1 text-[13.5px] font-bold lg:flex">
          <Link href="/" className={cn("rounded-xl px-3 py-2 hover:bg-gray-100", pathname === "/" && "bg-gray-900 text-white hover:bg-gray-900")}>
            Shop
          </Link>
          {isVendor ? (
            <Link href="/vendor" className={cn("rounded-xl px-3 py-2 hover:bg-gray-100", pathname.startsWith("/vendor") && "bg-gray-900 text-white")}>
              Vendor Dashboard
            </Link>
          ) : (
            <Link href="/account" className={cn("rounded-xl px-3 py-2 hover:bg-gray-100", pathname.startsWith("/account") && "bg-gray-900 text-white")}>
              My Orders
            </Link>
          )}
          <a href="https://wa.me/919876543210?text=Hi%20ZapKart!" target="_blank" className="rounded-xl px-3 py-2 text-green-700 hover:bg-green-50">
            WhatsApp Help
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-gray-200" />
          ) : user ? (
            <div className="relative">
              <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-xl bg-green-100 text-sm font-black text-green-800">
                  {user.avatarUrl ? <img src={user.avatarUrl} className="h-full w-full object-cover" alt="" /> : user.name[0]}
                </span>
                <span className="hidden max-w-[110px] truncate text-left text-[13px] font-bold leading-tight sm:block">
                  {user.name.split(" ")[0]}
                  <span className={cn("block text-[10px] font-bold uppercase tracking-wide", isVendor ? "text-purple-600" : "text-green-700")}>
                    {user.role}
                  </span>
                </span>
                <span className="text-gray-400">▾</span>
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="truncate text-[14px] font-bold">{user.name}</p>
                      <p className="truncate text-[12px] text-gray-500">{user.email}</p>
                    </div>
                    {isVendor ? (
                      <>
                        <MenuLink href="/vendor" label="📊 Dashboard overview" />
                        <MenuLink href="/vendor/inventory" label="📦 Live inventory" />
                        <MenuLink href="/vendor/orders" label="🧾 Orders" />
                        <MenuLink href="/vendor/chats" label="💬 Customer chats" />
                        <MenuLink href="/vendor/settings" label="⚙️ Store settings" />
                        {store && <div className="border-t border-gray-100 px-4 py-2 text-[12px] text-gray-500">🏪 {store.shopName}</div>}
                      </>
                    ) : (
                      <>
                        <MenuLink href="/account" label="🧾 My orders & chats" />
                        <MenuLink href="/?q=milk" label="🥛 Shop groceries" />
                      </>
                    )}
                    <button onClick={logout} className="w-full border-t border-gray-100 px-4 py-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth" className="rounded-xl px-3.5 py-2 text-[13.5px] font-bold text-gray-700 hover:bg-gray-100">
                Login
              </Link>
              <Link href="/auth?mode=signup" className="rounded-xl bg-neutral-900 px-4 py-2 text-[13.5px] font-bold text-white shadow hover:bg-black">
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-gray-100 px-4 py-2 md:hidden">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onSearch?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") router.push(`/?q=${encodeURIComponent(q)}`);
          }}
          placeholder="Search stores & items..."
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[14px] outline-none focus:border-green-600"
        />
      </div>
    </header>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-4 py-2.5 text-[13px] font-bold text-gray-700 hover:bg-gray-50">
      {label}
    </Link>
  );
}
