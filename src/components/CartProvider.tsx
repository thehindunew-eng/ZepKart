"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { productId: string; name: string; price: number; imageUrl: string | null; weightLabel: string; qty: number };
export type CartService = { serviceId: string; title: string; price: number; unitLabel: string; qty: number };
export type Cart = { storeId: string | null; storeName: string | null; items: CartItem[]; services: CartService[] };

type CartCtx = {
  cart: Cart;
  ready: boolean;
  count: number;
  addItem: (p: Omit<CartItem, "qty">, qty?: number) => boolean;
  setItemQty: (productId: string, qty: number) => void;
  addService: (s: Omit<CartService, "qty">, storeId: string, qty?: number) => boolean;
  setServiceQty: (serviceId: string, qty: number) => void;
  clear: () => void;
  switchStore: (storeId: string, storeName: string) => void;
};

const KEY = "zepkart.cart.v1";
const EMPTY: Cart = { storeId: null, storeName: null, items: [], services: [] };
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once on mount
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(cart));
  }, [cart, ready]);

  const switchStore = useCallback((storeId: string, storeName: string) => {
    setCart((c) => (c.storeId === storeId ? c : { storeId, storeName, items: [], services: [] }));
  }, []);

  const addItem = useCallback((p: Omit<CartItem, "qty">, qty = 1) => {
    let added = true;
    setCart((c) => {
      const exists = c.items.find((i) => i.productId === p.productId);
      if (exists) return { ...c, items: c.items.map((i) => (i.productId === p.productId ? { ...i, qty: Math.min(50, i.qty + qty) } : i)) };
      return { ...c, items: [...c.items, { ...p, qty }] };
    });
    return added;
  }, []);

  const setItemQty = useCallback((productId: string, qty: number) => {
    setCart((c) => ({
      ...c,
      items: qty <= 0 ? c.items.filter((i) => i.productId !== productId) : c.items.map((i) => (i.productId === productId ? { ...i, qty: Math.min(50, qty) } : i)),
    }));
  }, []);

  const addService = useCallback((s: Omit<CartService, "qty">, storeId: string, qty = 1) => {
    let ok = true;
    setCart((c) => {
      if (c.storeId && c.storeId !== storeId) {
        ok = false;
        return c;
      }
      const exists = c.services.find((x) => x.serviceId === s.serviceId);
      const services = exists
        ? c.services.map((x) => (x.serviceId === s.serviceId ? { ...x, qty: Math.min(10, x.qty + qty) } : x))
        : [...c.services, { ...s, qty }];
      return { ...c, storeId: c.storeId ?? storeId, services };
    });
    return ok;
  }, []);

  const setServiceQty = useCallback((serviceId: string, qty: number) => {
    setCart((c) => ({
      ...c,
      services: qty <= 0 ? c.services.filter((s) => s.serviceId !== serviceId) : c.services.map((s) => (s.serviceId === serviceId ? { ...s, qty: Math.min(10, qty) } : s)),
    }));
  }, []);

  const clear = useCallback(() => setCart(EMPTY), []);

  const count = cart.items.reduce((a, i) => a + i.qty, 0) + cart.services.reduce((a, s) => a + s.qty, 0);
  const val = useMemo(
    () => ({ cart, ready, count, addItem, setItemQty, addService, setServiceQty, clear, switchStore }),
    [cart, ready, count, addItem, setItemQty, addService, setServiceQty, clear, switchStore],
  );
  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};
