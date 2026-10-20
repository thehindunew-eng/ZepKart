import { createHash } from "node:crypto";

/** Demo riders. Real dispatch would come from a rider app. Names are fictional. */
const RIDERS = [
  { name: "Ravi Kumar", vehicle: "Bike · Honda Activa" },
  { name: "Imran Khan", vehicle: "Bike · Hero Splendor" },
  { name: "Suresh Yadav", vehicle: "EV scooter" },
  { name: "Anil Mehta", vehicle: "Bike · TVS Jupiter" },
  { name: "Deepak Rawat", vehicle: "Cycle · Cargo" },
];

/** Picks a rider for an order and a demo phone number (customer-only). */
export function assignRider(orderId: string) {
  const h = createHash("sha256").update(orderId).digest();
  const rider = RIDERS[h[0] % RIDERS.length];
  const tail = String(h.readUInt32BE(4) % 1_0000_0000).padStart(8, "0");
  return { name: rider.name, vehicle: rider.vehicle, phone: `9${tail}` };
}

/** Demo delivery runs in real time but is capped to 12 minutes so the live view can be seen. */
export const DEMO_TRIP_MS = 12 * 60 * 1000;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 100) / 100;
}

export function riderProgress(dispatchedAt: Date | null, etaMinutes: number, now = Date.now()) {
  if (!dispatchedAt) return 0;
  const trip = Math.min(DEMO_TRIP_MS, Math.max(2, etaMinutes) * 60 * 1000);
  return Math.min(1, Math.max(0, (now - dispatchedAt.getTime()) / trip));
}
