"use client";

import { useEffect, useState } from "react";
import { LocateFixed, MapPin, Pencil } from "lucide-react";
import { api, ApiError } from "@/hooks/useApi";
import { readSavedLocation, saveLocation, useLocation, type SavedLocation } from "@/hooks/useLocation";
import { cn } from "@/lib/utils";

/**
 * Top-of-page location. Shoppers set their area by pincode (or GPS), which drives the
 * "nearest" sorting and delivery distances across the app.
 */
export function LocationBar() {
  const point = useLocation();
  const [editing, setEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedLocation | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable on the client
    setSaved(readSavedLocation());
  }, [point.label]);

  const applyPincode = async (value: string) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ location: SavedLocation }>(`/api/location?pincode=${encodeURIComponent(value)}`);
      saveLocation(r.location);
      setSaved(r.location);
      setEditing(false);
      setPin("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Couldn't set that pincode");
    } finally {
      setBusy(false);
    }
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setErr("Your browser can't share location");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gps: SavedLocation = { pincode: "", city: "", locality: "Your current location", lat: pos.coords.latitude, lng: pos.coords.longitude };
        saveLocation(gps);
        setSaved(gps);
        setBusy(false);
        setEditing(false);
      },
      () => {
        setErr("Location permission was blocked. Enter a pincode instead.");
        setBusy(false);
      },
      { timeout: 8000 },
    );
  };

  const label = saved ? (saved.pincode ? `${saved.locality}, ${saved.pincode}` : saved.locality) : point.precise ? "Your current location" : `${point.label} (default)`;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-[12.5px] sm:px-6">
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-ink/60">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-leaf-deep" />
          <span className="shrink-0">Deliver to</span>
          <span className="truncate font-extrabold text-ink" title={label}>{label}</span>
        </span>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn3d inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-bold text-ink hover:bg-gray-200">
            <Pencil className="h-3 w-3" /> Change pincode
          </button>
        ) : (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (/^\d{6}$/.test(pin)) applyPincode(pin);
              else setErr("Enter a 6-digit pincode");
            }}
          >
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="Pincode e.g. 110001"
              aria-label="Pincode"
              autoFocus
              className="field !w-40 !rounded-full !py-1.5 !text-[13px]"
            />
            <button type="submit" disabled={busy || pin.length !== 6} className="btn3d rounded-full bg-ink px-3.5 py-1.5 font-bold text-white disabled:opacity-50">
              {busy ? "Checking…" : "Set"}
            </button>
            <button type="button" onClick={useGps} disabled={busy} className="btn3d inline-flex items-center gap-1 rounded-full bg-leaf/10 px-3 py-1.5 font-bold text-leaf-deep">
              <LocateFixed className="h-3.5 w-3.5" /> Use my location
            </button>
            <button type="button" onClick={() => { setEditing(false); setErr(null); }} className="px-2 font-semibold text-ink/50 hover:text-ink">Cancel</button>
          </form>
        )}
        {saved && !editing && (
          <button onClick={() => { saveLocation(null); setSaved(null); }} className="font-semibold text-ink/50 hover:text-ink">Reset</button>
        )}
        {err && <span className={cn("font-semibold text-red-700")}>{err}</span>}
      </div>
    </div>
  );
}
