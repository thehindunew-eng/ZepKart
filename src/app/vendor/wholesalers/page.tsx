"use client";

import Link from "next/link";
import { Crown, Star, MapPin, Package, Warehouse } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { EmptyState, Skeleton } from "@/components/ui";
import { useState } from "react";
import { CITIES } from "@/lib/ncr";
import { cn } from "@/lib/utils";

type W = { id: string; businessName: string; description: string | null; locality: string | null; city: string; rating: number; ratingCount: number; itemCount: number; distanceKm: number | null };

export default function VendorWholesalers() {
  const { store } = useAuth();
  const [city, setCity] = useState("");
  const premium = store?.plan === "premium";
  const dir = useApi<{ wholesalers: W[] }>(premium ? `/api/wholesalers${city ? `?city=${encodeURIComponent(city)}` : ""}` : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-black tracking-tight">Wholesalers</h1>
          <p className="text-[13.5px] text-ink/55">Find wholesalers across NCR by price, quality, and distance.</p>
        </div>
        {premium && (
          <div className="flex gap-2">
            {["", ...CITIES].map((c) => (
              <button key={c || "all"} onClick={() => setCity(c)} className={cn("rounded-full px-3.5 py-1.5 text-[12.5px] font-bold", city === c ? "bg-ink text-white" : "border border-gray-200 bg-white text-ink/70")}>
                {c || "All NCR"}
              </button>
            ))}
          </div>
        )}
      </div>

      {!premium ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#052e16] via-leaf-deep to-leaf p-6 text-white sm:flex-row sm:items-center">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider text-gold"><Crown className="h-3.5 w-3.5" /> Premium</p>
            <p className="mt-1 text-[18px] font-black">The wholesaler directory is part of Premium</p>
            <p className="text-[13.5px] text-white/80">Basic shops connect with customers. Premium adds wholesalers and restock.</p>
          </div>
          <Link href="/vendor/plan" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-black text-ink">View plans</Link>
        </div>
      ) : dir.loading && !dir.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : (dir.data?.wholesalers.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white"><EmptyState title="No wholesalers here yet" body="Try another city." /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dir.data!.wholesalers.map((w) => (
            <div key={w.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Warehouse className="h-5 w-5" /></div>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[12px] font-black text-amber-800"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{w.rating.toFixed(1)} <span className="font-semibold text-amber-800/60">({w.ratingCount})</span></span>
              </div>
              <p className="mt-3 text-[15px] font-black">{w.businessName}</p>
              <p className="mt-0.5 text-[12.5px] text-ink/55">{w.locality ? `${w.locality}, ` : ""}{w.city}</p>
              {w.description && <p className="mt-2 line-clamp-2 text-[12.5px] text-ink/65">{w.description}</p>}
              <div className="mt-4 flex flex-wrap gap-3 text-[12px] font-semibold text-ink/65">
                <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" />{w.itemCount} items listed</span>
                {w.distanceKm != null && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{w.distanceKm} km</span>}
              </div>
              <Link href="/vendor/restock" className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">Send restock</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
