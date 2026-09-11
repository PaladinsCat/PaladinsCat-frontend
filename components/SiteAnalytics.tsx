/**
 * Register privacy-preserving aggregate page-count analytics for the current pathname.
 * refs: none
 */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PUBLIC_BUCKETS = new Set([
  "about", "blog", "builds", "champions", "community", "contact", "docs",
  "features", "game", "leaderboard", "matches", "operations", "players",
  "privacy", "search", "stats", "terms", "tierlists",
]);

function pageCategory(pathname: string): string {
  if (pathname === "/") return "/";
  const firstSegment = pathname.split("/")[1]?.toLowerCase() ?? "";
  return PUBLIC_BUCKETS.has(firstSegment) ? `/${firstSegment}` : "/other";
}

/**
 * Render nothing while adding one anonymous aggregate page count for the current pathname.
 * refs: none
 * I/O types: `none -> null`.
 */
export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === "/auth" || pathname.startsWith("/auth/") || pathname === "/admin" || pathname.startsWith("/admin/")) return;
    const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (privacyNavigator.doNotTrack === "1" || privacyNavigator.globalPrivacyControl === true) return;
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pageCategory(pathname) }),
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  }, [pathname]);

  return null;
}
