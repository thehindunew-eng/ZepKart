"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Store, ShoppingBag, Loader2, Mail, Lock, User, Phone, MapPin } from "lucide-react";
import { api, ApiError } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Button, Field, Glass } from "@/components/ui";
import { Logo } from "@/components/ShopHeader";
import { CITIES } from "@/lib/ncr";
import { cn } from "@/lib/utils";

const DEMO = {
  vendor: { email: "vendor1@zepkart.demo", password: "vendor123", label: "Vendor" },
  customer: { email: "customer@zepkart.demo", password: "customer123", label: "Customer" },
} as const;

const DEFAULT_PIN: Record<string, string> = { Delhi: "110001", Noida: "201301", Gurugram: "122002" };

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const next = params.get("next");
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [role, setRole] = useState<"customer" | "vendor">(params.get("role") === "vendor" ? "vendor" : "customer");
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", shopName: "", city: "Delhi" as (typeof CITIES)[number] });
  const [err, setErr] = useState<string | null>(null);

  const finish = async (role: string) => {
    await refresh();
    const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : role === "vendor" ? "/vendor" : "/";
    router.replace(dest);
    router.refresh();
  };

  const login = async (email: string, password: string) => {
    try {
      return await api<{ user: { role: string } }>("/api/auth/login", { json: { email, password } });
    } catch (e) {
      // The demo accounts may not exist yet on a fresh database. Seed once, then retry.
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
        const r = await api<{ user: { role: string } }>("/api/auth/signup", { json: body });
        toast("Welcome to ZepKart");
        await finish(r.user.role);
      }
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid min-h-[80vh] items-center gap-8 lg:grid-cols-[1fr_440px] lg:gap-14">
      <div className="space-y-6 text-center lg:text-left">
        <Logo />
        <h1 className="text-[40px] font-black leading-[1.02] tracking-[-0.03em] sm:text-[56px]">Quick commerce for <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Delhi NCR.</span></h1>
        <p className="mx-auto max-w-md text-[16px] text-ink/65 lg:mx-0">Delhi, Noida and Gurugram stores, one app.</p>
        <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
          {CITIES.map((c) => (
            <span key={c} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold"><MapPin className="h-3.5 w-3.5" /> {c}</span>
          ))}
        </div>
      </div>

      <Glass strong className="rise space-y-6 !rounded-[32px] p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink/50">Try a demo account</p>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={!!busy} onClick={() => demoLogin("vendor")} className="btn-dark flex h-14 items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold disabled:opacity-60">
              {busy === "vendor" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />} Login as Vendor
            </button>
            <button disabled={!!busy} onClick={() => demoLogin("customer")} className="btn-gold flex h-14 items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold disabled:opacity-60">
              {busy === "customer" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />} Login as Customer
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[12px] font-semibold text-ink/40">
          <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
        </div>

        <div className="glass-pill grid grid-cols-2 rounded-full p-1 text-[13px] font-bold">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn("rounded-full py-2 transition", mode === m ? "bg-white text-ink shadow" : "text-ink/60")}>
              {m === "login" ? "Log in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/40 p-1 text-[13px] font-bold">
              {(["customer", "vendor"] as const).map((r) => (
                <button type="button" key={r} onClick={() => setRole(r)} className={cn("rounded-xl py-2 capitalize transition", role === r ? "bg-ink text-white" : "text-ink/65")}>{r === "customer" ? "Shopper" : "Shop owner"}</button>
              ))}
            </div>
          )}
          {mode === "signup" && (
            <Field label="Full name">
              <div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" /><input className="field pl-10" required value={form.name} onChange={set("name")} autoComplete="name" /></div>
            </Field>
          )}
          <Field label="Email">
            <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" /><input className="field pl-10" type="email" required value={form.email} onChange={set("email")} autoComplete="email" /></div>
          </Field>
          <Field label="Password" hint={mode === "signup" ? "At least 6 characters" : undefined}>
            <div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" /><input className="field pl-10" type="password" required minLength={mode === "signup" ? 6 : 1} value={form.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>
          </Field>
          {mode === "signup" && (
            <>
              <Field label="Mobile number">
                <div className="relative"><Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" /><input className="field pl-10" inputMode="tel" required={role === "vendor"} value={form.phone} onChange={set("phone")} placeholder="10-digit Indian mobile" /></div>
              </Field>
              {role === "vendor" && (
                <>
                  <Field label="Shop name"><input className="field" required value={form.shopName} onChange={set("shopName")} /></Field>
                  <Field label="City">
                    <select className="field" value={form.city} onChange={set("city")}>
                      {CITIES.map((c) => <option key={c} value={c}>{c} ({DEFAULT_PIN[c]})</option>)}
                    </select>
                  </Field>
                </>
              )}
            </>
          )}
          {err && <p role="alert" className="rounded-2xl bg-red-50/90 px-4 py-2.5 text-[13px] font-semibold text-red-800">{err}</p>}
          <Button type="submit" block size="lg" loading={busy === "form"} disabled={!!busy}>
            {mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-[12.5px] text-ink/55">
          <Link href="/" className="font-bold text-ink hover:underline">Continue browsing</Link>
        </p>
      </Glass>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <AuthInner />
    </Suspense>
  );
}
