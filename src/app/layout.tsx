import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  title: "ZepKart · Groceries from NCR stores",
  description: "Order from neighbourhood stores in Delhi, Noida and Gurugram. Pickup or delivery, chat and bargain.",
};

export const viewport: Viewport = { themeColor: "#f6ecd7", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
