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
};

type AuthCtx = {
  user: AuthUser | null;
  store: VendorStore | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setStore: (s: VendorStore | null) => void;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, store: null, loading: true, refresh: async () => {}, setStore: () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<VendorStore | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const j = await api<{ user: AuthUser | null; store: VendorStore | null }>("/api/auth/me");
      setUser(j.user);
      setStore(j.store);
    } catch {
      setUser(null);
      setStore(null);
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
    window.location.href = "/";
  }, []);

  const val = useMemo(() => ({ user, store, loading, refresh, setStore, logout }), [user, store, loading, refresh, logout]);
  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
