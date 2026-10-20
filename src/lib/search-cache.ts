"use client";

/**
 * Browser-side memory for search. Keeps the last few queries and their results so the shopper
 * can pick a result again without a new search. Results expire after 10 minutes.
 */
export type CachedHit = { id: string; name: string; price: number; storeName: string; imageUrl: string | null; category: string };

const RECENT_KEY = "zk-recent-searches";
const CACHE_KEY = "zk-search-cache";
const TTL_MS = 10 * 60 * 1000;
const MAX_RECENT = 6;
const MAX_CACHED = 12;

type CacheEntry = { q: string; at: number; hits: CachedHit[] };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: search still works, just without memory.
  }
}

const norm = (q: string) => q.trim().toLowerCase();

export function recentSearches(): string[] {
  return read<string[]>(RECENT_KEY, []);
}

export function rememberSearch(q: string) {
  const v = q.trim();
  if (v.length < 2) return;
  const next = [v, ...recentSearches().filter((x) => norm(x) !== norm(v))].slice(0, MAX_RECENT);
  write(RECENT_KEY, next);
}

export function clearRecentSearches() {
  write(RECENT_KEY, []);
}

function allEntries(): CacheEntry[] {
  return read<CacheEntry[]>(CACHE_KEY, []).filter((e) => Date.now() - e.at < TTL_MS);
}

/** Cached hits for this exact query, or null when it has to be searched again. */
export function cachedHits(q: string): CachedHit[] | null {
  const hit = allEntries().find((e) => norm(e.q) === norm(q));
  return hit ? hit.hits : null;
}

export function storeHits(q: string, hits: CachedHit[]) {
  const others = allEntries().filter((e) => norm(e.q) !== norm(q));
  write(CACHE_KEY, [{ q: q.trim(), at: Date.now(), hits }, ...others].slice(0, MAX_CACHED));
}

/** Recently seen items across cached searches. Shown before the shopper types anything. */
export function recentlySeenHits(limit = 6): CachedHit[] {
  const seen = new Set<string>();
  const out: CachedHit[] = [];
  for (const e of allEntries()) {
    for (const h of e.hits) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      out.push(h);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
