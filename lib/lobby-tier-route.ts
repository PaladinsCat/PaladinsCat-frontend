/** Parses and formats lobby-tier route query parameters.
 * The module owns the existing URL, context, or locale-message boundary.
 * refs: none
 */
const LOBBY_TIER_ROOTS = ["/champions", "/matches", "/stats", "/game"] as const;
const LOBBY_TIER_EXCLUDED_STATS_ROUTES = [
  "/stats/ecpm",
  "/stats/egpm",
  "/stats/activity",
  "/stats/tiers",
] as const;

function isRouteOrDescendant(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/** Apply routeUsesLobbyTierSelector to lobby-tier or localization inputs.
 * Contract: returns the normalized route, context state, or message value while preserving existing browser behavior.
 * Returns: `boolean`
 * refs: none
 */
export function routeUsesLobbyTierSelector(pathname: string): boolean {
  if (LOBBY_TIER_EXCLUDED_STATS_ROUTES.some(
    route => isRouteOrDescendant(pathname, route),
  )) {
    return false;
  }
  return LOBBY_TIER_ROOTS.some(root => isRouteOrDescendant(pathname, root));
}
