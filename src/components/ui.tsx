"use client";

import { cn } from "@/lib/utils";

export function Badge({ children, tone = "gray", className }: { children: React.ReactNode; tone?: "green" | "red" | "amber" | "gray" | "purple" | "blue" | "black"; className?: string }) {
  const tones: Record<string, string> = {
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    amber: "bg-amber-100 text-amber-900 border-amber-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    black: "bg-neutral-900 text-white border-neutral-900",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function OpenBadge({ isOpen, nextOpeningAt, nextClosingAt }: { isOpen: boolean; nextOpeningAt?: string | null; nextClosingAt?: string | null }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", isOpen ? "bg-green-600 text-white" : "bg-neutral-900 text-white")}>
        <span className={cn("h-1.5 w-1.5 rounded-full live-dot", isOpen ? "bg-green-200" : "bg-red-400")} />
        {isOpen ? "OPEN NOW" : "CLOSED"}
      </span>
      <span className="text-[11px] font-medium text-gray-500">{isOpen ? nextClosingAt : nextOpeningAt}</span>
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-2xl">📦</div>
      <p className="mt-4 text-[15px] font-bold text-gray-900">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-[13px] text-gray-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-gray-200/80", className)} />;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-gray-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-600/10 placeholder:text-gray-400";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(21,128,61,0.3)] transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
export const btnDark =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-black active:scale-[0.98] disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-bold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50";
