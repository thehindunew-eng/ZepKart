"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, User, Phone, Store, Warehouse, ShoppingBag, ArrowRight } from "lucide-react";
import { api, ApiError } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Button, Field } from "@/components/ui";
import { Logo } from "@/components/ShopHeader";
import { CITIES } from "@/lib/ncr";
import { cn } from "@/lib/utils";

type Role = "customer" | "vendor" | "wholesaler";

const DEMO = {
  customer: { email: "customer@zepkart.demo", password: "customer123", label: "Customer", icon: ShoppingBag },
  vendor: { email: "vendor1@zepkart.demo", password: "vendor123", label: "Vendor", icon: Store },
  wholesaler: { email: "wholesaler1@zepkart.demo", password: "wholesaler123", label: "Wholesaler", icon: Warehouse },
} as const;

const ROLE_COPY: Record<Role, { label: string; hint: string; shopLabel: string }> = {
  customer: { label: "Customer", hint: "Shop nearby stores and compare prices.", shopLabel: "" },
  vendor: { label: "Vendor", hint: "Run your shop, inventory and bookings.", shopLabel: "Shop name" },
  wholesaler: { label: "Wholesaler", hint: "Quote shops and list your catalog.", shopLabel: "Business name" },
};

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const next = params.get("next");
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const initialRole = params.get("role");
  const [role, setRole] = useState<Role>(initialRole === "vendor" || initialRole === "wholesaler" ? initialRole : "customer");
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", shopName: "", gstin: "", city: "Delhi" as (typeof CITIES)[number] });
  const [err, setErr] = useState<string | null>(null);

  const finish = async (r: string) => {
    await refresh();
    const fallback = r === "vendor" ? "/vendor" : r === "wholesaler" ? "/wholesaler" : "/";
    const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
    router.replace(dest);
    router.refresh();
  };

  const login = async (email: string, password: string) => {
    try {
      return await api<{ user: { role: string } }>("/api/auth/login", { json: { email, password } });
    } catch (e) {
      // Demo accounts may not exist on a fresh database. Seed once, then retry.
      if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
        await api("/api/seed", { method: "POST" });
        return await api<{ user: { role: string } }>("/api/auth/login", { json: { email, password } });
      }
      throw e;
    }
  };

  const demoLogin = async (kind: keyof typeof DEMO) => {
    setBusy(kind);
    setErr(null);
    try {
      const r = await login(DEMO[kind].email, DEMO[kind].password);
      await finish(r.user.role);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("form");
    setErr(null);
    try {
      if (mode === "login") {
        const r = await api<{ user: { role: string } }>("/api/auth/login", { json: { email: form.email, password: form.password } });
        await finish(r.user.role);
      } else {
        const body: Record<string, unknown> = { name: form.name, email: form.email, password: form.password, phone: form.phone, role };
        if (role === "vendor") {
          body.shopName = form.shopName;
          body.city = form.city;
        }
        if (role === "wholesaler") {
          body.shopName = form.shopName;
          body.gstin = form.gstin || undefined;
          body.city = form.city;
        }
        const r = await api<{ user: { role: string } }>("/api/auth/signup", { json: body });
        toast("Welcome to ZepKart");
        await finish(r.user.role);
      }
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <Link href="/" className="text-[13px] font-bold text-ink/60 hover:text-ink">Browse without logging in</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_440px] lg:py-12">
        <section className="flex flex-col justify-center">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-leaf-deep">Delhi · Noida · Gurugram</p>
          <h1 className="mt-2 text-[34px] font-black leading-tight tracking-tight sm:text-[44px]">Groceries from stores near you, at the best price.</h1>
          <p className="mt-3 max-w-lg text-[15px] text-ink/65">Shops, customers and wholesalers, all on one app.</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {(Object.keys(DEMO) as (keyof typeof DEMO)[]).map((k) => {
              const D = DEMO[k];
              const Icon = D.icon;
              return (
                <button
                  key={k}
                  disabled={!!busy}
                  onClick={() => demoLogin(k)}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:shadow-md disabled:opacity-60"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf/10 text-leaf-deep"><Icon className="h-5 w-5" /></span>
                  <span className="text-[15px] font-black">{D.label} demo</span>
                  <span className="flex w-full items-center justify-between text-[12px] font-bold text-ink/55">
                    One click {busy === k ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                  </span>
                </button>
              );
            })}
          </div>
          {err && !busy && <p className="mt-4 text-[13px] font-semibold text-red-700">{err}</p>}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="grid grid-cols-2 rounded-full bg-gray-100 p-1 text-[13.5px] font-bold">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cn("rounded-full py-2 transition", mode === m ? "bg-white text-ink shadow-sm" : "text-ink/55")}>
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {(["customer", "vendor", "wholesaler"] as Role[]).map((r) => (
                <button key={r} onClick={() => setRole(r)} className={cn("rounded-xl border px-2 py-2.5 text-[12.5px] font-bold transition", role === r ? "border-ink bg-ink text-white" : "border-gray-200 text-ink/70 hover:border-gray-300")}>
                  {ROLE_COPY[r].label}
                </button>
              ))}
            </div>
          )}
          {mode === "signup" && <p className="mt-2 text-[12.5px] text-ink/55">{ROLE_COPY[role].hint}</p>}

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === "signup" && (
              <Field label={role === "wholesaler" ? "Contact name" : "Full name"}>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field pl-10" autoComplete="name" />
                </div>
              </Field>
            )}
            <Field label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field pl-10" autoComplete="email" />
              </div>
            </Field>
            <Field label="Password" hint={mode === "signup" ? "At least 6 characters" : undefined}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field pl-10" autoComplete={mode === "login" ? "current-password" : "new-password"} />
              </div>
            </Field>
            {mode === "signup" && (
              <>
                <Field label="Phone">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field pl-10" inputMode="tel" />
                  </div>
                </Field>
                {role !== "customer" && (
                  <>
                    <Field label={ROLE_COPY[role].shopLabel}>
                      <input required value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="field" />
                    </Field>
                    <Field label="City">
                      <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value as (typeof CITIES)[number] })} className="field">
                        {CITIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                  </>
                )}
                {role === "wholesaler" && (
                  <Field label="GSTIN (optional)">
                    <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="field uppercase" maxLength={15} />
                  </Field>
                )}
              </>
            )}
            <Button type="submit" variant="dark" size="lg" block loading={busy === "form"}>
              {mode === "login" ? "Log in" : `Create ${ROLE_COPY[role].label.toLowerCase()} account`}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
      <AuthInner />
    </Suspense>
  );
}
