import type { ReactNode } from "react";
import { ShopHeader, MobileTabs } from "@/components/ShopHeader";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:pb-14 lg:pt-8">{children}</main>
      <MobileTabs />
    </div>
  );
}
