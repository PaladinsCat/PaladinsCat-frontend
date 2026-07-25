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

export function routeUsesLobbyTierSelector(pathname: string): boolean {
  if (LOBBY_TIER_EXCLUDED_STATS_ROUTES.some(
    route => isRouteOrDescendant(pathname, route),
  )) {
    return false;
  }
  return LOBBY_TIER_ROOTS.some(root => isRouteOrDescendant(pathname, root));
}
