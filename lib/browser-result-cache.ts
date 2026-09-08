/** Caches browser API results with expiry and invalidation.
 * This cache stores browser API results with expiry and explicit invalidation.
 * refs: none
 */
type CacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

/**
 * Read and JSON-decode a sessionStorage cache envelope. Return null during SSR, for missing data, on storage/parse errors, or after deleting an expired entry; return its stored value otherwise. This does not validate the value against T.
 * refs: none
 * I/O types: `key: string -> T | null`.
 */
export function readBrowserResult<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CacheEnvelope<T>;
    if (!cached || cached.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return cached.value;
  } catch {
    return null;
  }
}

/**
 * Write a JSON sessionStorage envelope expiring after ttlMs and return the supplied value. During SSR or storage/serialization failure, return the value without persistence.
 * refs: none
 * I/O types: `key: string; value: T; ttlMs: number -> T`.
 */
export function writeBrowserResult<T>(key: string, value: T, ttlMs: number): T {
  if (typeof window === "undefined") return value;
  try {
    const cached: CacheEnvelope<T> = { expiresAt: Date.now() + ttlMs, value };
    window.sessionStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // Storage may be unavailable or full. The in-memory request cache remains.
  }
  return value;
}

/**
 * Remove the sessionStorage entry at key; do nothing during SSR and suppress storage errors.
 * refs: none
 * I/O types: `key: string -> void`.
 */
export function removeBrowserResult(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage may be unavailable; there is nothing else to clear.
  }
}
