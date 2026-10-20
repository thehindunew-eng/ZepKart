"use client";

import { useEffect, useState } from "react";
import { Bike, Footprints, Navigation, Phone, Store, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/hooks/useApi";
import { Badge, Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";

type TrackData = {
  id: string;
  status: string;
  fulfillment: "pickup" | "delivery";
  stage: string;
  store: { id: string; name: string; lat: number | null; lng: number | null; locality: string | null } | null;
  destination: { lat: number; lng: number } | null;
  rider: { name: string; vehicle: string | null; phone: string | null; position: { lat: number; lng: number } | null; distanceKm: number | null; etaMinutes: number | null } | null;
  progress: number;
  updatedAt: string;
};

const mapsDirections = (dest: { lat: number; lng: number }, origin?: { lat: number; lng: number } | null) =>
  `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving${origin ? `&origin=${origin.lat},${origin.lng}` : ""}`;

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const r = (d: number) => (d * Math.PI) / 180;
  const x = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 100) / 100;
}

/** "Track" button for a booking. Delivery: live rider position. Pickup: route to the store. */
export function TrackButton({ orderId, status, fulfillment, storeName }: { orderId: string; status: string; fulfillment: "pickup" | "delivery"; storeName?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="gold" size="sm" onClick={() => setOpen(true)}>
        <Navigation className="h-3.5 w-3.5" /> Track
      </Button>
      {open && <TrackModal orderId={orderId} initialStatus={status} fulfillment={fulfillment} storeName={storeName} onClose={() => setOpen(false)} />}
    </>
  );
}

function TrackModal({ orderId, initialStatus, fulfillment, storeName, onClose }: { orderId: string; initialStatus: string; fulfillment: "pickup" | "delivery"; storeName?: string; onClose: () => void }) {
  const [data, setData] = useState<TrackData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsDenied, setGpsDenied] = useState(false);

  // Live refresh every 5 seconds while the sheet is open.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await api<TrackData>(`/api/orders/${orderId}/track`);
        if (alive) {
          setData(d);
          setErr(null);
        }
      } catch (e) {
        if (alive) setErr((e as Error).message);
      }
    };
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [orderId]);

  // Pickup: follow the customer's own position to show how far the store is.
  useEffect(() => {
    if (fulfillment !== "pickup" || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (p) => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setGpsDenied(true),
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [fulfillment]);

  const status = data?.status ?? initialStatus;
  const done = status === "completed";
  const storePoint = data?.store?.lat != null && data?.store?.lng != null ? { lat: data.store.lat, lng: data.store.lng } : null;
  const pct = Math.round((data?.progress ?? 0) * 100);
  const title = fulfillment === "delivery" ? "Track delivery" : "Track your pickup";

  return (
    <Modal open onClose={onClose} title={title} wide>
      {!data && !err && <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-ink/40" /></div>}
      {err && <p className="rounded-2xl bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-800">{err}</p>}

      {data && fulfillment === "delivery" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-ink/50">Live status</p>
              <p className="text-[18px] font-black">{data.stage}</p>
            </div>
            <Badge tone={done ? "green" : "dark"}>{done ? "Delivered" : "Live"}</Badge>
          </div>

          <RouteStrip progress={data.progress} />

          {data.rider ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-leaf/10 text-leaf-deep"><Bike className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold">{data.rider.name}</p>
                  <p className="truncate text-[12.5px] text-ink/55">{data.rider.vehicle ?? "Delivery partner"}</p>
                </div>
                {data.rider.phone && (
                  <a href={`tel:+91${data.rider.phone}`} className="btn3d inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[12.5px] font-bold text-white">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Progress" value={`${pct}%`} />
                <Stat label="Distance" value={data.rider.distanceKm != null ? `${data.rider.distanceKm} km` : "—"} />
                <Stat label="ETA" value={done ? "Arrived" : data.rider.etaMinutes != null ? `${data.rider.etaMinutes} min` : "—"} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-4 text-[13.5px] text-ink/65">
              {done ? "Delivered. Thank you for shopping local." : "A rider is assigned once the store sends your order out."}
            </div>
          )}

          {data.destination && data.rider?.position && !done && (
            <a href={mapsDirections(data.destination, data.rider.position)} target="_blank" rel="noreferrer" className="btn3d flex items-center justify-center gap-2 rounded-2xl bg-leaf px-4 py-3 text-[14px] font-bold text-white">
              <Navigation className="h-4 w-4" /> Open rider route in Google Maps
            </a>
          )}
          <p className="text-center text-[11.5px] text-ink/45">Updates every 5 seconds · Demo trips run up to 12 minutes</p>
        </div>
      )}

      {data && fulfillment === "pickup" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-ink/50">{storeName ?? data.store?.name ?? "Store"}</p>
              <p className="text-[18px] font-black">{data.stage}</p>
            </div>
            <Badge tone="gray"><Footprints className="h-3 w-3" /> Pickup</Badge>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink"><Store className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-extrabold">{data.store?.name ?? "Store"}</p>
                <p className="truncate text-[12.5px] text-ink/55">{data.store?.locality ?? ""}</p>
              </div>
              {me && storePoint && <p className="text-right"><span className="block text-[18px] font-black">{km(me, storePoint)} km</span><span className="text-[11.5px] text-ink/50">away</span></p>}
            </div>
            {gpsDenied && <p className="mt-3 text-[12.5px] text-ink/55">Allow location in your browser to see how far you are from the store.</p>}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {storePoint && !done && (
              <a href={mapsDirections(storePoint, me)} target="_blank" rel="noreferrer" className="btn3d flex items-center justify-center gap-2 rounded-2xl bg-leaf px-4 py-3 text-[14px] font-bold text-white">
                <Navigation className="h-4 w-4" /> Route to store in Google Maps
              </a>
            )}
            {data.store && (
              <Link href={`/stores/${data.store.id}`} onClick={onClose} className="btn3d flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-[14px] font-bold text-white">
                <Store className="h-4 w-4" /> Visit store page
              </Link>
            )}
          </div>
          <p className="text-center text-[11.5px] text-ink/45">Status updates every 5 seconds</p>
        </div>
      )}
    </Modal>
  );
}

function RouteStrip({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative px-2 pb-6 pt-7">
      <div className="h-1.5 rounded-full bg-ink/10" />
      <div className="absolute left-2 top-[34px] h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-[width] duration-700" style={{ width: `calc((100% - 16px) * ${p})` }} />
      <div className="absolute top-[18px] -translate-x-1/2 text-center" style={{ left: "8px" }}>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] text-white"><Store className="h-3 w-3" /></span>
        <span className="mt-1 block text-[10.5px] font-bold text-ink/55">Store</span>
      </div>
      <div className="absolute top-[18px] -translate-x-1/2 text-center transition-[left] duration-700" style={{ left: `calc(8px + (100% - 16px) * ${p})` }}>
        <span className={cn("grid h-6 w-6 place-items-center rounded-full text-white shadow", p >= 1 ? "bg-leaf" : "bg-emerald-600 ring-4 ring-emerald-500/20")}><Bike className="h-3 w-3" /></span>
        <span className="mt-1 block whitespace-nowrap text-[10.5px] font-bold text-ink/70">Rider</span>
      </div>
      <div className="absolute right-2 top-[18px] text-center">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-[10px] text-white">You</span>
        <span className="mt-1 block text-[10.5px] font-bold text-ink/55">Home</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-2 py-2.5">
      <p className="text-[15px] font-black tabular-nums">{value}</p>
      <p className="text-[11px] font-semibold text-ink/50">{label}</p>
    </div>
  );
}
