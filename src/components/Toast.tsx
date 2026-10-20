"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

type Tone = "ok" | "error";
type Item = { id: number; msg: string; tone: Tone };
type Ctx = { toast: (msg: string, tone?: Tone) => void };

const ToastCtx = createContext<Ctx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);

  const toast = useCallback((msg: string, tone: Tone = "ok") => {
    const id = ++seq.current;
    setItems((xs) => [...xs, { id, msg, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
  }, []);

  const val = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastCtx.Provider value={val}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {items.map((t) => (
          <div key={t.id} className="glass-strong rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-[13.5px] font-semibold shadow-xl">
            {t.tone === "ok" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
