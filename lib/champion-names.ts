/**
 * Champion name resolver — fetches the full champion list from the backend
 * /reference/champions endpoint (backed by the `champions` table).
 *
 * Usage:
 *
 *   // Hook (recommended — reactive, auto-renders when loaded)
 *   const championName = useChampionName(2288); // "Cassie"
 *
 *   // Imperative (server components or one-off lookups)
 *   const name = await getChampionName(2288);
 *
 * Failure recovery: if the fetch fails, the cache clears so the next call
 * retries automatically. No manual refresh needed.
 */

import { fetchReferenceChampions } from "./api-client";

// ── Module-level cache ──

let championMap: Map<number, string> | null = null;
let loadingPromise: Promise<void> | null = null;

/**
 * Fetch and cache the champion ID→name map.
 * On failure, clears the promise so the next call retries.
 */
async function loadChampionMap(): Promise<void> {
  // If already cached, short-circuit
  if (championMap) return;

  // Deduplicate concurrent calls
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const list = await fetchReferenceChampions();
      const map = new Map<number, string>();
      for (const { id, name } of list) {
        map.set(id, name);
      }
      championMap = map;
    } finally {
      // Always clear so a failed fetch doesn't poison future lookups
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

// ── Imperative API ──

/**
 * Resolve a champion ID to its name. Returns the ID as a string fallback if
 * the map hasn't loaded or the champion isn't found.
 */
export async function getChampionName(id: number): Promise<string> {
  await loadChampionMap();
  return championMap?.get(id) || String(id);
}

/**
 * Force-refresh the map (useful for after backend reseed).
 * Returns: `Promise<void>`
 */
export function refreshChampionMap(): Promise<void> {
  championMap = null;
  return loadChampionMap();
}

/**
 * Get all available champions as { id, name } pairs.
 * Returns: `Array<{ id: number; name: string }> | null`
 */
export function getChampions(): Array<{ id: number; name: string }> | null {
  if (!championMap) return null;
  return Array.from(championMap.entries()).map(([id, name]) => ({ id, name }));
}

// ── React Hook ──

import { useEffect, useState } from "react";

/**
 * React hook that resolves a champion ID to its name.
 *
 * Returns `{ name: string | null, loading: boolean }`.
 * `name` is `null` while the reference list is being fetched.
 * When the API resolves, the component re-renders automatically.
 */
export function useChampionName(id: number): { name: string | null; loading: boolean } {
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const resolved = await getChampionName(id);
        if (!cancelled) setName(resolved);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Sync path: if the map is already cached, resolve synchronously
    const cached = championMap?.get(id);
    if (cached) {
      setName(cached);
      setLoading(false);
      return;
    }

    resolve();

    return () => { cancelled = true; };
  }, [id]);

  return { name, loading };
}

/**
 * React hook that loads the full champion list (for dropdowns / select inputs).
 */
export function useChampions(): { champions: Array<{ id: number; name: string }> | null; loading: boolean } {
  const [champions, setChampions] = useState<Array<{ id: number; name: string }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getChampions();
    if (cached) {
      setChampions(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadChampionMap();
        if (!cancelled) {
          const list = getChampions();
          setChampions(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { champions, loading };
}
