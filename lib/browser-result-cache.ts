/** Caches browser API results with expiry and invalidation.
 * This cache stores browser API results with expiry and explicit invalidation.
 */
type CacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

/** readBrowserResult applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
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

/** writeBrowserResult applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
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

/** removeBrowserResult applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 * Returns: `void`
 */
export function removeBrowserResult(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage may be unavailable; there is nothing else to clear.
  }
}
