"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Search, X, ArrowRight } from "lucide-react";
import { api } from "@/hooks/useApi";
import { cn, money } from "@/lib/utils";
import {
  type CachedHit,
  cachedHits,
  clearRecentSearches,
  recentSearches,
  recentlySeenHits,
  rememberSearch,
  storeHits,
} from "@/lib/search-cache";

type Props = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  /** Where a submitted search goes. Defaults to the storefront with ?q=. */
  basePath?: string;
  name?: string;
};

/**
 * Search field used across the app. The magnifier disappears as soon as the user types.
 * Focusing it shows recent searches and recently seen items from the cache. Repeat searches
 * come from the cache and skip the network.
 */
export function SearchBox({ className, inputClassName, placeholder = "Search items or stores", basePath = "/", name = "q" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<CachedHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [seen, setSeen] = useState<CachedHit[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  const term = q.trim();

  // Load browser memory once the field is first opened, so the first paint stays server-rendered.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable on the client
    setRecent(recentSearches());
    setSeen(recentlySeenHits());
  }, [open]);

  // Debounced lookup: cache first, network only for a new query.
  useEffect(() => {
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the list when the field is cleared
      setHits([]);
      setLoading(false);
      return;
    }
    const cached = cachedHits(term);
    if (cached) {
      setHits(cached);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api<{ products: { id: string; name: string; price: number; storeName: string; imageUrl: string | null; category: string }[] }>(
          `/api/products?q=${encodeURIComponent(term)}&limit=6&sort=price`,
        );
        if (id !== reqId.current) return;
        const mapped: CachedHit[] = r.products.map((p) => ({ id: p.id, name: p.name, price: p.price, storeName: p.storeName, imageUrl: p.imageUrl, category: p.category }));
        storeHits(term, mapped);
        setHits(mapped);
      } catch {
        if (id === reqId.current) setHits([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term]);

  // Close when clicking elsewhere.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const submit = (value: string) => {
    const v = value.trim();
    if (v) rememberSearch(v);
    setOpen(false);
    router.push(v ? `${basePath}?${name}=${encodeURIComponent(v)}` : basePath);
  };

  const showPanel = open;
  const empty = useMemo(() => term.length < 2, [term]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="relative"
      >
        {!q && <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden />}
        <input
          name={name}
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Search"
          autoComplete="off"
          className={cn("field !rounded-xl !bg-gray-100 !py-2.5", !q ? "pl-10" : "pl-3.5 pr-10", inputClassName)}
        />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setHits([]); }} className="no-3d absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink/50 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
          {empty ? (
            <>
              {recent.length > 0 && (
                <div className="p-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[11.5px] font-black uppercase tracking-wider text-ink/45">Recent searches</p>
                    <button type="button" onClick={() => { clearRecentSearches(); setRecent([]); }} className="text-[12px] font-bold text-ink/50 hover:text-ink">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button key={r} type="button" onClick={() => { setQ(r); submit(r); }} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[12.5px] font-bold text-ink/80 hover:bg-gray-200">
                        <Clock className="h-3 w-3" /> {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {seen.length > 0 && (
                <div className="p-2">
                  <p className="mb-1.5 text-[11.5px] font-black uppercase tracking-wider text-ink/45">Seen recently</p>
                  <HitList hits={seen} onPick={() => setOpen(false)} />
                </div>
              )}
              {recent.length === 0 && seen.length === 0 && <p className="p-3 text-[13px] text-ink/55">Type at least 2 letters to search items and stores.</p>}
            </>
          ) : (
            <>
              {loading && hits.length === 0 ? (
                <p className="p-3 text-[13px] font-semibold text-ink/55">Searching…</p>
              ) : hits.length === 0 ? (
                <p className="p-3 text-[13px] text-ink/55">No quick matches for “{term}”. Press Enter to search everything.</p>
              ) : (
                <HitList hits={hits} onPick={() => setOpen(false)} />
              )}
              <button type="button" onClick={() => submit(term)} className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-leaf-deep hover:bg-leaf/5">
                Search all for “{term}” <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HitList({ hits, onPick }: { hits: CachedHit[]; onPick: () => void }) {
  return (
    <ul className="space-y-0.5">
      {hits.slice(0, 6).map((h) => (
        <li key={h.id}>
          <Link href={`/products/${h.id}`} onClick={onPick} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-base">
              {h.imageUrl ? <img src={h.imageUrl} alt="" className="h-full w-full object-cover" /> : "🛍️"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-extrabold">{h.name}</span>
              <span className="block truncate text-[12px] text-ink/55">{h.storeName}</span>
            </span>
            <span className="shrink-0 text-[13px] font-black">{money(h.price)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
