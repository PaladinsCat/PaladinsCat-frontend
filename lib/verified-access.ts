/** Owns verified-account routing for gated website sections. */

const LEGACY_STATS_PATHS = ["/game/items", "/game/maps", "/game/compositions"] as const;
const VERIFIED_PORTALS = ["/stats", "/players"] as const;
const ACCOUNT_PORTALS = ["/community", "/builds", "/tierlists"] as const;

/** Identify every Community-menu route that requires a signed-in account. */
export function isAccountOnlyPath(path: string): boolean {
  return ACCOUNT_PORTALS.some((portal) => path === portal || path.startsWith(`${portal}/`));
}

/** Return the requested Community destination once browser authentication is known. */
export function accountDestination(requestedPath: string, user: object | null, isLoading: boolean): string | null {
  if (isLoading) return null;
  return user ? requestedPath : `/auth/login?redirect=${encodeURIComponent(requestedPath)}`;
}

/** Identify every detail route whose portal remains public but content requires verification. */
export function isVerifiedOnlyPath(path: string): boolean {
  if (VERIFIED_PORTALS.some((portal) => path.startsWith(`${portal}/`))) return true;
  return LEGACY_STATS_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** Return the allowed gated destination once browser authentication is known. */
export function verifiedDestination(
  requestedPath: string,
  user: { linkedPlayerId: number | null } | null,
  isLoading: boolean,
): string | null {
  if (isLoading) return null;
  if (!user) return `/auth/login?redirect=${encodeURIComponent(requestedPath)}`;
  if (user.linkedPlayerId == null) return "/link-account";
  return requestedPath;
}
