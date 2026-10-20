"use client";

export function AdminHead({ title, body, right }: { title: string; body?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[24px] font-black tracking-tight">{title}</h1>
        {body && <p className="mt-1 text-[13.5px] text-ink/55">{body}</p>}
      </div>
      {right}
    </div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white ${className ?? ""}`}>{children}</div>;
}

export function StatCard({ label, value, href, tone }: { label: string; value: string | number; href?: string; tone?: "warn" }) {
  const body = (
    <div className={`rounded-2xl border bg-white p-5 ${tone === "warn" ? "border-amber-300" : "border-gray-200"}`}>
      <p className="text-[12px] font-bold uppercase tracking-wider text-ink/50">{label}</p>
      <p className="mt-2 text-[26px] font-black tabular-nums">{value}</p>
    </div>
  );
  return href ? <a href={href} className="block transition hover:-translate-y-0.5">{body}</a> : body;
}
