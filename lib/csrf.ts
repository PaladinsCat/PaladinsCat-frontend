/** Builds CSRF headers for browser API requests.
 * The module preserves the existing validation, storage, formatting, or asset boundary.
 * Returns: `string | null`
 * refs: none
 */
/** Apply csrfHeader to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * refs: none
 */
export function csrfHeader(cookie: string, method: string): string | null {
  if (["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase())) return null;
  const raw = cookie.split("; ").find((entry) => entry.startsWith("__Host-pc_csrf="))?.slice("__Host-pc_csrf=".length);
  if (!raw) return null;
  try { return decodeURIComponent(raw); } catch { return null; }
}
