"use client";

import { useEffect, useState } from "react";

/** Connaught Place. Used when the browser does not share a location. */
export const DEFAULT_POINT = { lat: 28.6315, lng: 77.2167, label: "Connaught Place" };

export type GeoPoint = { lat: number; lng: number; label: string; precise: boolean };

/**
 * The shopper's point for distance sorting. Asks the browser once. Falls back to Connaught Place
 * so sorting still works if permission is refused.
 */
export function useLocation(): GeoPoint {
  const [point, setPoint] = useState<GeoPoint>({ ...DEFAULT_POINT, precise: false });
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location", precise: true }),
      () => undefined,
      { maximumAge: 300000, timeout: 6000 },
    );
  }, []);
  return point;
}
