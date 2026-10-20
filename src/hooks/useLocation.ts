"use client";

import { useEffect, useState } from "react";

/** Connaught Place. Used when the shopper hasn't set a location or shared GPS. */
export const DEFAULT_POINT = { lat: 28.6315, lng: 77.2167, label: "Connaught Place" };

export type GeoPoint = { lat: number; lng: number; label: string; precise: boolean; pincode?: string };

/** A pincode pick (pincode set) or a GPS fix (pincode empty). */
export type SavedLocation = { pincode: string; city: string; locality: string; lat: number; lng: number };

const KEY = "zk-location";
const EVENT = "zk-location-change";

export function readSavedLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

/** Saves a pincode location for the whole app and tells every open view to update. */
export function saveLocation(loc: SavedLocation | null) {
  try {
    if (loc) window.localStorage.setItem(KEY, JSON.stringify(loc));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(EVENT));
}

function toPoint(saved: SavedLocation): GeoPoint {
  const gps = !saved.pincode;
  return {
    lat: saved.lat,
    lng: saved.lng,
    label: gps ? saved.locality : `${saved.locality}, ${saved.pincode}`,
    precise: gps,
    pincode: saved.pincode || undefined,
  };
}

/**
 * The shopper's point for distance sorting. A pincode they picked wins. Otherwise we ask the
 * browser once and fall back to Connaught Place if permission is refused.
 */
export function useLocation(): GeoPoint {
  const [point, setPoint] = useState<GeoPoint>({ ...DEFAULT_POINT, precise: false });

  useEffect(() => {
    const apply = () => {
      const saved = readSavedLocation();
      if (saved) {
        setPoint(toPoint(saved));
        return true;
      }
      return false;
    };
    const hasSaved = apply();
    const onChange = () => {
      if (!apply()) setPoint({ ...DEFAULT_POINT, precise: false });
    };
    window.addEventListener(EVENT, onChange);
    if (!hasSaved && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!readSavedLocation()) setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location", precise: true });
        },
        () => undefined,
        { maximumAge: 300000, timeout: 6000 },
      );
    }
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  return point;
}
