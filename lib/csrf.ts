export function csrfHeader(cookie: string, method: string): string | null {
  if (["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase())) return null;
  const raw = cookie.split("; ").find((entry) => entry.startsWith("__Host-pc_csrf="))?.slice("__Host-pc_csrf=".length);
  if (!raw) return null;
  try { return decodeURIComponent(raw); } catch { return null; }
}
