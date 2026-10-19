"use client";

import { useCallback, useEffect, useState } from "react";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** JSON fetch helper. Throws ApiError with the server's message. */
export async function api<T = unknown>(url: string, opts: { method?: string; json?: unknown; body?: FormData } = {}): Promise<T> {
  const init: RequestInit = { method: opts.method ?? (opts.json !== undefined || opts.body ? "POST" : "GET"), cache: "no-store" };
  if (opts.json !== undefined) {
    init.body = JSON.stringify(opts.json);
    init.headers = { "Content-Type": "application/json" };
  } else if (opts.body) {
    init.body = opts.body;
  }
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(j.error || "Something went wrong. Please try again.", r.status);
  return j as T;
}

/** Re-runs `fn` every `ms` while the tab is visible. Keeps the latest fn without resubscribing. */
export function usePoll(fn: () => void, ms: number | null) {
  useEffect(() => {
    if (!ms) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fn();
    }, ms);
    return () => clearInterval(id);
  }, [fn, ms]);
}

/** Loads JSON from `url` and optionally keeps it fresh by polling. */
export function useApi<T>(url: string | null, opts: { poll?: number | null } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!url) return;
    try {
      const d = await api<T>(url);
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set only after the await
    load();
  }, [load]);
  usePoll(load, opts.poll ?? null);

  return { data, error, loading, reload: load, setData };
}
