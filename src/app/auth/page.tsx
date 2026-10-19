"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { inputCls, btnPrimary, Field } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";

function AuthInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [role, setRole] = useState(params.get("role") === "vendor" ? "vendor" : "customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState<"vendor" | "customer" | null>(null);

  const DEMO_ACCOUNTS = {
    vendor: { email: "vendor1@zapkart.demo", password: "vendor123" },
    customer: { email: "customer@zapkart.demo", password: "customer123" },
  } as const;

  const postAuth = async (path: string, body: Record<string, unknown>) => {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data: j };
  };

  const finishLogin = async (role: string) => {
    await refresh();
    const next = params.get("next");
    if (next) router.push(next);
    else router.push(role === "vendor" ? "/vendor" : "/");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await postAuth(`/api/auth/${mode}`, { name, email, password, phone, role });
      if (!res.ok) {
        setErr(res.data.error || "Something went wrong");
        return;
      }
      await finishLogin(res.data.user.role);
    } finally {
      setBusy(false);
    }
  };

  // One-click demo login: signs in straight away, no extra "Login" press needed.
  const loginDemo = async (kind: "vendor" | "customer") => {
    const acct = DEMO_ACCOUNTS[kind];
    setErr("");
    setMode("login");
    setEmail(acct.email);
    setPassword(acct.password);
    setDemoBusy(kind);
    try {
      const attempt = () => postAuth("/api/auth/login", { email: acct.email, password: acct.password });
      let res = await attempt();
      if (res.status === 404) {
        // Demo accounts don't exist on this database yet: seed them, then retry once.
        await fetch("/api/seed", { method: "POST" });
        res = await attempt();
      }
      if (!res.ok) {
        setErr(res.data.error || "Demo login failed. Please try again.");
        return;
      }
      await finishLogin(res.data.user.role);
    } catch {
      setErr("Couldn't reach the server. Please try again.");
    } finally {
      setDemoBusy(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl">
          <div className="flex border-b border-gray-100">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-4 text-[14px] font-black capitalize ${mode === m ? "bg-neutral-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {m === "login" ? "Welcome back" : "Join ZapKart"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4 p-6 sm:p-8">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5">
                {(["customer", "vendor"] as const).map((r) => (
                  <button type="button" key={r} onClick={() => setRole(r)} className={`rounded-xl py-2.5 text-[13.5px] font-black capitalize ${role === r ? "bg-white shadow" : "text-gray-500"}`}>
                    {r === "customer" ? "🛒 Customer" : "🏪 Vendor"}
                  </button>
                ))}
              </div>
            )}
            {mode === "signup" && (
              <Field label="Full name">
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Ramesh Gupta" className={inputCls} />
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@shop.com" className={inputCls} />
              </Field>
              <Field label={mode === "signup" ? "Phone / WhatsApp" : "Password (phone optional on signup)"}>
                {mode === "signup" ? (
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className={inputCls} />
                ) : (
                  <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="••••••••" className={inputCls} />
                )}
              </Field>
            </div>
            {mode === "signup" && (
              <Field label="Password">
                <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} type="password" placeholder="Min 6 characters" className={inputCls} />
              </Field>
            )}
            {mode === "login" && (
              <Field label="Phone (optional)">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For faster delivery contact" className={inputCls} />
              </Field>
            )}
            {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">{err}</p>}
            <button disabled={busy} className={`${btnPrimary} w-full !py-3.5 !text-[15px]`}>
              {busy ? "Please wait…" : mode === "login" ? "Login →" : role === "vendor" ? "Create vendor account + store 🏪" : "Create customer account 🛒"}
            </button>
            <p className="text-center text-[12.5px] text-gray-500">
              {mode === "login" ? "New here? " : "Already have an account? "}
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-bold text-green-700 underline">
                {mode === "login" ? "Sign up" : "Login"}
              </button>
            </p>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] bg-neutral-950 p-6 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-lime-300">Try instantly — no signup needed</p>
            <h3 className="mt-2 text-[20px] font-black">One-click demo logins</h3>
            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => loginDemo("vendor")}
                disabled={demoBusy !== null}
                className="w-full rounded-2xl bg-purple-600 px-4 py-3 text-left transition hover:bg-purple-500 disabled:cursor-wait disabled:opacity-70"
              >
                <span className="block text-[14px] font-black">{demoBusy === "vendor" ? "⏳ Signing in…" : "🏪 Login as Vendor"}</span>
                <span className="block font-mono text-[12px] text-white/70">vendor1@zapkart.demo / vendor123</span>
              </button>
              <button
                type="button"
                onClick={() => loginDemo("customer")}
                disabled={demoBusy !== null}
                className="w-full rounded-2xl bg-green-700 px-4 py-3 text-left transition hover:bg-green-600 disabled:cursor-wait disabled:opacity-70"
              >
                <span className="block text-[14px] font-black">{demoBusy === "customer" ? "⏳ Signing in…" : "🛒 Login as Customer"}</span>
                <span className="block font-mono text-[12px] text-white/70">customer@zapkart.demo / customer123</span>
              </button>
            </div>
            <p className="mt-3 text-[12px] text-white/60">One click signs you straight in. Vendors land on the live dashboard.</p>
          </div>
          <div className="rounded-[28px] border border-green-200 bg-green-50 p-6">
            <p className="text-[14px] font-black text-green-900">What you get 👇</p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-green-900/80">
              <li>✓ Vendors: live inventory, OOS toggle, open/close + timings</li>
              <li>✓ Facilities with price + 60-sec video ads per season</li>
              <li>✓ Customers: bargain chat, pickup/delivery, WhatsApp order</li>
            </ul>
            <Link href="/" className="mt-3 inline-block text-[13px] font-bold text-green-800 underline">← Back to bazaar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <AuthInner />
    </Suspense>
  );
}
