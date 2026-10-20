"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, Phone, User, Save, ShieldCheck } from "lucide-react";
import { api, ApiError } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Button, Field, Glass, Skeleton } from "@/components/ui";

const ROLE_LABEL: Record<string, string> = { customer: "Customer", vendor: "Vendor", wholesaler: "Wholesaler", admin: "Admin" };

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- copy the signed-in profile into the form once it loads
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user]);

  if (loading) return <Skeleton className="h-96" />;
  if (!user) {
    return (
      <Glass className="mx-auto max-w-md p-8 text-center">
        <p className="text-[18px] font-black">Log in to see your profile</p>
        <Link href="/auth?next=/profile" className="mt-4 inline-block"><Button>Log in</Button></Link>
      </Glass>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api("/api/profile", { method: "PATCH", json: { name, phone } });
      await refresh();
      toast("Profile saved");
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Couldn't save your profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_260px]">
      <Glass className="p-6 sm:p-8">
        <h1 className="text-[24px] font-black tracking-tight">Your profile</h1>
        <p className="mt-1 text-[13.5px] text-ink/55">Keep your name and phone up to date so stores and riders can reach you.</p>
        <form onSubmit={save} className="mt-6 space-y-4">
          <Field label="Name">
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input required value={name} onChange={(e) => setName(e.target.value)} className="field pl-10" />
            </div>
          </Field>
          <Field label="Phone" hint="Used for order updates and rider calls">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="field pl-10" placeholder="98xxxxxxxx" />
            </div>
          </Field>
          {err && <p className="text-[13px] font-semibold text-red-700">{err}</p>}
          <Button type="submit" variant="dark" loading={busy}><Save className="h-4 w-4" /> Save changes</Button>
        </form>
      </Glass>

      <Glass className="space-y-4 p-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink/50">Account</p>
          <p className="mt-1 flex items-center gap-2 text-[14px] font-extrabold"><ShieldCheck className="h-4 w-4 text-leaf-deep" /> {ROLE_LABEL[user.role] ?? user.role}</p>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink/50">Email</p>
          <p className="mt-1 flex items-center gap-2 break-all text-[13.5px] font-semibold"><Mail className="h-4 w-4 shrink-0 text-ink/40" /> {user.email}</p>
          <p className="mt-1 text-[11.5px] text-ink/45">Email can&apos;t be changed here. Contact us if you need it updated.</p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          {user.role === "customer" && <Link href="/orders"><Button variant="soft" block>My orders</Button></Link>}
          {user.role === "vendor" && <Link href="/vendor"><Button variant="soft" block>Vendor dashboard</Button></Link>}
          {user.role === "wholesaler" && <Link href="/wholesaler"><Button variant="soft" block>Wholesale desk</Button></Link>}
          {user.role === "admin" && <Link href="/admin"><Button variant="soft" block>Admin console</Button></Link>}
          <Link href="/contact"><Button variant="soft" block>Contact ZepKart</Button></Link>
        </div>
      </Glass>
    </div>
  );
}
