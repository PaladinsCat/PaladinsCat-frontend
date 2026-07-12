"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "pc_anonymous_visitor";
const LAST_VIEW_KEY = "pc_last_tracked_view";

function anonymousVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/auth" || pathname.startsWith("/auth/")) return;
    if (navigator.doNotTrack === "1") return;

    const now = Date.now();
    try {
      const previous = JSON.parse(window.sessionStorage.getItem(LAST_VIEW_KEY) || "null") as { path?: string; at?: number } | null;
      if (previous?.path === pathname && now - Number(previous.at || 0) < 5_000) return;
      window.sessionStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ path: pathname, at: now }));
    } catch {
      // Session storage can be disabled. The backend still stores only a hash.
    }

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: anonymousVisitorId(), path: pathname }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  }, [pathname]);

  return null;
}
