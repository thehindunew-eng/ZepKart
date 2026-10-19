/** All store scheduling is done in India Standard Time (IST, UTC+05:30). */
const IST_MIN = 330;
export const IST_TZ = "Asia/Kolkata";

export function istParts(d: Date) {
  const t = new Date(d.getTime() + IST_MIN * 60000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), min: t.getUTCMinutes() };
}

/** Instant for IST wall-clock time, offset by `dayOffset` days from `now`. */
export function istAt(now: Date, dayOffset: number, h: number, min = 0) {
  const p = istParts(now);
  return new Date(Date.UTC(p.y, p.m - 1, p.d + dayOffset, h, min) - IST_MIN * 60000);
}

/** Parses a "YYYY-MM-DDTHH:mm" string (from a datetime-local input) as IST. */
export function parseIstLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[];
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_MIN * 60000);
}

/** Formats an instant as "YYYY-MM-DDTHH:mm" in IST for datetime-local inputs. */
export function toIstLocal(d: Date | string | null | undefined) {
  if (!d) return "";
  const p = istParts(new Date(d));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}

export function formatTimeIst(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST_TZ }).format(d);
}

export function dayKey(d: Date) {
  const p = istParts(d);
  return `${p.y}-${p.m}-${p.d}`;
}

/** "today" / "tomorrow" / weekday + date, relative to `now` in IST. */
export function dayLabelIst(d: Date, now: Date) {
  const diff = Math.round((Date.UTC(istParts(d).y, istParts(d).m - 1, istParts(d).d) - Date.UTC(istParts(now).y, istParts(now).m - 1, istParts(now).d)) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: IST_TZ }).format(d);
}

export function formatDateTimeIst(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST_TZ }).format(new Date(d));
}

export function formatDateIst(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST_TZ }).format(new Date(d));
}

/** Human status line shown to customers, e.g. "Opens tomorrow 7:00 AM". */
export function storeStatusText(s: { isOpen: boolean; nextOpeningAt?: string | Date | null; nextClosingAt?: string | Date | null }, now = new Date()) {
  if (s.isOpen) {
    if (!s.nextClosingAt) return "Open now";
    const c = new Date(s.nextClosingAt);
    return `Open · closes ${dayLabelIst(c, now) === "today" ? "" : dayLabelIst(c, now) + " "}${formatTimeIst(c)}`.replace("  ", " ");
  }
  if (!s.nextOpeningAt) return "Closed";
  const o = new Date(s.nextOpeningAt);
  return `Opens ${dayLabelIst(o, now)} ${formatTimeIst(o)}`;
}

export const WEEKDAY_IST = (d: Date) => new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: IST_TZ }).format(d);
