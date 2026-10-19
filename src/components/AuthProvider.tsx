"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type Store = {
  id: string;
  ownerId: string | null;
  shopName: string;
  description: string | null;
  dpUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  category: string | null;
  isOpen: boolean;
  nextOpeningAt: string | null;
  nextClosingAt: string | null;
  openingHours: string | null;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryFee: string;
  deliveryRadiusKm: string;
  rating: string | null;
};

type AuthCtx = {
  user: AuthUser | null;
  store: Store | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, store: null, loading: true, refresh: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await r.json();
      setUser(j.user);
      setStore(j.store ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStore(null);
    window.location.href = "/";
  }, []);

  const val = useMemo(() => ({ user, store, loading, refresh, logout }), [user, store, loading, refresh, logout]);
  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
