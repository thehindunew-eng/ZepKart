"use client";

import type { ReactNode } from "react";
import { ShopHeader } from "@/components/ShopHeader";
import { LocationBar } from "@/components/LocationBar";
import { useAuth } from "@/components/AuthProvider";

export default function ShopLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  // Vendors, wholesalers and admins work in their own consoles. Shoppers see the delivery location.
  const shopper = !loading && (!user || user.role === "customer");
  return (
    <div className="min-h-screen">
      {shopper && <LocationBar />}
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:pt-7">{children}</main>
    </div>
  );
}
