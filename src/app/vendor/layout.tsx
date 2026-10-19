"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const NAV = [
  ["Overview", "/vendor", "📊"],
  ["Live Inventory", "/vendor/inventory", "📦"],
  ["Facilities", "/vendor/facilities", "✨"],
  ["Video Ads", "/vendor/promos", "▶"],
  ["Orders", "/vendor/orders", "🧾"],
  ["Chats", "/vendor/chats", "💬"],
  ["Store Settings", "/vendor/settings", "⚙️"],
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, store, loading, refresh } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth?next=/vendor");
    else if (!loading && user && user.role !== "vendor") router.push("/account");
  }, [loading, user, router]);

  const toggleOpen = async () => {
    if (!store) return;
    setToggling(true);
    await fetch(`/api/stores/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen: !store.isOpen }),
    });
    await refresh();
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="h-40 animate-pulse rounded-3xl bg-gray-200" />
        </div>
      </div>
    );
  }
  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-4xl">🏪</p>
          <h1 className="mt-3 text-[22px] font-black">Vendor area</h1>
          <p className="mt-1 text-[14px] text-gray-500">Login as a vendor to manage live inventory, orders & chats.</p>
          <Link href="/auth?role=vendor" className="mt-4 inline-block rounded-2xl bg-neutral-900 px-5 py-3 text-[14px] font-bold text-white">Vendor login →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-7xl gap-5 px-4 py-6">
        {/* sidebar desktop */}
        <aside className="sticky top-[140px] hidden h-fit w-64 shrink-0 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm lg:block">
          <div className="border-b border-gray-100 bg-gradient-to-br from-green-900 to-green-700 p-5 text-white">
            <div className="flex items-center gap-3">
              <img src={store?.dpUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80"} className="h-12 w-12 rounded-2xl border-2 border-white/40 object-cover" alt="" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-black">{store?.shopName ?? "My Store"}</p>
                <p className="text-[11px] text-white/70">{user.name} · vendor</p>
              </div>
            </div>
            <button onClick={toggleOpen} disabled={toggling} className={`mt-3 flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13px] font-black ${store?.isOpen ? "bg-green-400 text-green-950" : "bg-white/15 text-white"}`}>
              <span>{store?.isOpen ? "● OPEN NOW" : "○ CLOSED"}</span>
              <span className="rounded-lg bg-black/20 px-2 py-1 text-[11px]">{toggling ? "…" : "Toggle"}</span>
            </button>
            <p className="mt-1.5 text-[11px] text-white/70">{store?.isOpen ? store?.nextClosingAt : store?.nextOpeningAt}</p>
          </div>
          <nav className="p-2.5">
            {NAV.map(([label, href, icon]) => {
              const active = href === "/vendor" ? pathname === "/vendor" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-bold transition", active ? "bg-neutral-900 text-white" : "text-gray-600 hover:bg-gray-100")}>
                  <span>{icon}</span> {label}
                  {label === "Chats" && <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-800">live</span>}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-100 p-3">
            {store && <Link href={`/stores/${store.id}`} className="block rounded-2xl bg-green-50 px-3.5 py-2.5 text-center text-[13px] font-black text-green-800 hover:bg-green-100">👁 View public store →</Link>}
          </div>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1">
          {/* mobile nav */}
          <div className="mb-4 lg:hidden">
            <button onClick={() => setMobileNav(!mobileNav)} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-[13.5px] font-black">
              {mobileNav ? "✕ Close menu" : "☰ Vendor menu — " + (NAV.find(([, h]) => (h === "/vendor" ? pathname === h : pathname.startsWith(h)))?.[0] ?? "Overview")}
            </button>
            {mobileNav && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {NAV.map(([label, href, icon]) => (
                  <Link key={href} href={href} onClick={() => setMobileNav(false)} className={cn("rounded-2xl border px-3 py-2.5 text-[13px] font-bold", (href === "/vendor" ? pathname === href : pathname.startsWith(href)) ? "border-neutral-900 bg-neutral-900 text-white" : "border-gray-200 bg-white")}>
                    {icon} {label}
                  </Link>
                ))}
              </div>
            )}
            {store && (
              <button onClick={toggleOpen} className={`mt-2 w-full rounded-2xl px-4 py-3 text-[13.5px] font-black text-white ${store.isOpen ? "bg-green-700" : "bg-neutral-900"}`}>
                {store.isOpen ? "● OPEN — tap to close" : "○ CLOSED — tap to open"}
              </button>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
