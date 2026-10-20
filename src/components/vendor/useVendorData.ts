"use client";

import { useAuth } from "@/components/AuthProvider";

export type VProduct = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  price: number;
  mrp: number;
  weightValue: number;
  weightUnit: string;
  weightLabel: string;
  available: boolean;
  stockLeft: number | null;
  bargainEnabled: boolean;
  gstRate: number;
  gstIncluded: number;
  inStock: boolean;
  stockQty: number;
  floorPrice: number | null;
  updatedAt: string;
};

export type VService = { id: string; storeId: string; title: string; description: string | null; imageUrl: string | null; price: number; unitLabel: string; gstRate: number; isActive: boolean };

/** Vendor pages render only for a signed-in vendor who owns a store. */
export function useVendorGate() {
  const { user, store, loading } = useAuth();
  return { user, store, loading, ready: !loading && !!user && user.role === "vendor" && !!store };
}
