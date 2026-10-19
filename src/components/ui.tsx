"use client";

import { forwardRef, useEffect, useId, useRef } from "react";
import Link from "next/link";
import { X, Loader2, Store, ArrowUpRight } from "lucide-react";
import { cn, CATEGORY_EMOJI } from "@/lib/utils";
import { storeStatusText } from "@/lib/time";

export function Glass({ className, strong, dark, as: Tag = "div", children, ...rest }: React.HTMLAttributes<HTMLElement> & { strong?: boolean; dark?: boolean; as?: "div" | "section" | "article" | "aside" }) {
  const Comp = Tag as "div";
  return (
    <Comp className={cn(dark ? "glass-dark" : "glass", strong && !dark && "glass-strong", className)} {...rest}>
      {children}
    </Comp>
  );
}

type BtnVariant = "primary" | "gold" | "dark" | "ghost" | "danger" | "soft";
const BTN: Record<BtnVariant, string> = {
  primary: "btn-primary",
  gold: "btn-gold",
  dark: "btn-dark",
  danger: "btn-danger",
  ghost: "glass-pill text-ink hover:bg-white/80",
  soft: "bg-white/50 text-ink hover:bg-white/80 border border-white/70",
};

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; loading?: boolean; block?: boolean }>(
  function Button({ variant = "primary", size = "md", loading, block, className, children, disabled, ...rest }, ref) {
    const sizes = { sm: "h-9 px-3.5 text-[13px]", md: "h-11 px-5 text-[14px]", lg: "h-13 px-6 py-3.5 text-[15px]" };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold tracking-[-0.01em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55",
          sizes[size],
          BTN[variant],
          block && "w-full",
          className,
        )}
        {...rest}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

export const inputCls = "field";

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string | null; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.08em] text-ink/60">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-ink/50">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] font-semibold text-red-700">{error}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50", checked ? "bg-emerald-600" : "bg-ink/20")}
    >
      <span className={cn("inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

const TONES = {
  green: "bg-emerald-100/80 text-emerald-800 border-emerald-200/80",
  red: "bg-red-100/80 text-red-800 border-red-200/80",
  amber: "bg-amber-100/80 text-amber-900 border-amber-200/80",
  blue: "bg-sky-100/80 text-sky-900 border-sky-200/80",
  purple: "bg-violet-100/80 text-violet-900 border-violet-200/80",
  gray: "bg-white/60 text-ink/70 border-white/80",
  gold: "bg-amber-200/70 text-amber-900 border-amber-300/80",
  dark: "bg-ink text-white border-ink",
} as const;

export function Badge({ tone = "gray", children, className }: { tone?: keyof typeof TONES; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold", TONES[tone], className)}>{children}</span>;
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button aria-label="Close" className="absolute inset-0 bg-ink/25 backdrop-blur-[3px]" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={cn("glass-strong rise relative flex max-h-[92vh] w-full flex-col rounded-t-[30px] sm:rounded-[30px]", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between gap-3 border-b border-ink/5 px-6 py-4">
          <h3 id={titleId} className="text-[17px] font-extrabold tracking-tight">
            {title}
          </h3>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white/70 hover:bg-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-ink/5 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="glass mb-4 grid h-16 w-16 place-items-center rounded-3xl text-2xl">{icon ?? <Store className="h-7 w-7 text-ink/60" />}</div>
      <h4 className="text-[16px] font-extrabold">{title}</h4>
      {body && <p className="mt-1 max-w-sm text-[13.5px] text-ink/60">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-2xl bg-white/40", className)} />;
}

export function Spinner() {
  return <Loader2 className="h-5 w-5 animate-spin text-ink/50" />;
}

export function ProductImage({ src, category, alt, className }: { src: string | null; category: string; alt: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <div className={cn("grid h-full w-full place-items-center bg-gradient-to-br from-amber-100 via-white to-emerald-100 text-5xl", className)} aria-label={alt}>
      <span aria-hidden>{CATEGORY_EMOJI[category] ?? "🛍️"}</span>
    </div>
  );
}

export function StatusPill({ isOpen, nextOpeningAt, nextClosingAt, onClick, compact }: { isOpen: boolean; nextOpeningAt?: string | null; nextClosingAt?: string | null; onClick?: () => void; compact?: boolean }) {
  const text = storeStatusText({ isOpen, nextOpeningAt, nextClosingAt });
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-bold",
        isOpen ? "border-emerald-300/70 bg-emerald-100/80 text-emerald-900" : "border-red-200/80 bg-red-100/70 text-red-800",
        onClick && "transition hover:brightness-95",
        compact && "px-2.5 py-1 text-[11.5px]",
      )}
    >
      <span className="relative flex h-2 w-2">
        {isOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", isOpen ? "bg-emerald-600" : "bg-red-500")} />
      </span>
      <span className="truncate">{text}</span>
    </Tag>
  );
}

/** One-click navigation to a store inside the app. */
export function VisitStoreButton({ storeId, label = "Visit store", size = "sm" }: { storeId: string; label?: string; size?: "sm" | "md" }) {
  return (
    <Link href={`/stores/${storeId}`} className={cn("inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 font-bold text-ink shadow-sm transition hover:bg-white", size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]")}>
      <Store className="h-3.5 w-3.5" />
      {label}
      <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
    </Link>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99, disabled, size = "md" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <div className="inline-flex items-center rounded-full border border-white/80 bg-white/70 p-0.5 shadow-sm">
      <button type="button" aria-label="Decrease" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} className={cn(dim, "rounded-full text-lg font-bold hover:bg-white disabled:opacity-35")}>
        −
      </button>
      <span className="min-w-8 px-2 text-center text-[14px] font-extrabold tabular-nums">{value}</span>
      <button type="button" aria-label="Increase" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className={cn(dim, "rounded-full text-lg font-bold hover:bg-white disabled:opacity-35")}>
        +
      </button>
    </div>
  );
}
