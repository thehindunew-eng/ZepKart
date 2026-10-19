"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/hooks/useApi";

export type AuthUser = { id: string; email: string; name: string; role: string; phone?: string | null; avatarUrl?: string | null };

export type VendorStore = {
  id: string;
  shopName: string;
  description: string | null;
  dpUrl: string | null;
  coverUrl: string | null;
  whatsapp: string | null;
  phone: string | null;
  address: string | null;
  locality: string | null;
  city: string;
  pincode: string | null;
  category: string;
  isOpen: boolean;
  nextOpeningAt: string | null;
  nextClosingAt: string | null;
  openingHours: string | null;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  deliveryFee: number;
  freeDeliveryAbove: number;
  minOrder: number;
  etaMinutes: number;
  rating: number;
  plan: "basic" | "premium";
  planExpiresAt: string | null;
};

export type WholesalerProfile = {
  id: string;
  businessName: string;
  description: string | null;
  dpUrl: string | null;
  gstin: string | null;
  phone: string | null;
  address: string | null;
  locality: string | null;
  city: string;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
};

type AuthCtx = {
  user: AuthUser | null;
  store: VendorStore | null;
  wholesaler: WholesalerProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setStore: (s: VendorStore | null) => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, store: null, wholesaler: null, loading: true, refresh: async () => {}, setStore: () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<VendorStore | null>(null);
  const [wholesaler, setWholesaler] = useState<WholesalerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const j = await api<{ user: AuthUser | null; store: VendorStore | null; wholesaler: WholesalerProfile | null }>("/api/auth/me");
      setUser(j.user);
      setStore(j.store);
      setWholesaler(j.wholesaler);
    } catch {
      setUser(null);
      setStore(null);
      setWholesaler(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set only after the await
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setStore(null);
    setWholesaler(null);
    window.location.href = "/";
  }, []);

  const val = useMemo(() => ({ user, store, wholesaler, loading, refresh, setStore, logout }), [user, store, wholesaler, loading, refresh, logout]);
  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
