import type { ReactNode } from "react";
import { ShopHeader } from "@/components/ShopHeader";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:pt-7">{children}</main>
    </div>
  );
}
