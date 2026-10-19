import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "ZapKart — Live Bazaar | Vendors + Customers",
  description: "Live inventory, bargaining chat, pickup/delivery, vendor promos. Zepto-style collaboration for neighbourhood stores.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f6f7f9] text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
