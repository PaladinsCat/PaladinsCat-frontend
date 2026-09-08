/**
 * Return the decoded __Host-pc_csrf cookie for unsafe methods; return null for GET/HEAD/OPTIONS/TRACE, a missing token, or invalid percent encoding.
 * Builds CSRF headers for browser API requests.
 * Returns: `string | null`
 * refs: none
 */
/**
 * Return the decoded __Host-pc_csrf cookie for unsafe methods; return null for GET/HEAD/OPTIONS/TRACE, a missing token, or invalid percent encoding.
 * refs: none
 * I/O types: `cookie: string; method: string -> string | null`.
 */
export function csrfHeader(cookie: string, method: string): string | null {
  if (["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase())) return null;
  const raw = cookie.split("; ").find((entry) => entry.startsWith("__Host-pc_csrf="))?.slice("__Host-pc_csrf=".length);
  if (!raw) return null;
  try { return decodeURIComponent(raw); } catch { return null; }
}
