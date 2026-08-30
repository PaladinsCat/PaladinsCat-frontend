"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "pc_anonymous_visitor";
const LAST_VIEW_KEY = "pc_last_tracked_view";
const LIVE_SESSION_HEARTBEAT_MS = 60_000;
const VISITOR_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
let volatileVisitorId: string | null = null;

function newVisitorId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function anonymousVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing && VISITOR_ID_PATTERN.test(existing)) return existing;
    const created = newVisitorId();
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    volatileVisitorId ??= newVisitorId();
    return volatileVisitorId;
  }
}

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === "/auth" || pathname.startsWith("/auth/") || pathname === "/admin" || pathname.startsWith("/admin/")) return;
    if (navigator.doNotTrack === "1") return;
    const visitorId = anonymousVisitorId();

    const post = (endpoint: "visit" | "heartbeat", body: Record<string, string>) => {
      void fetch(`/api/analytics/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, ...body }),
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    };

    const now = Date.now();
    let recordPageView = true;
    try {
      const previous = JSON.parse(window.sessionStorage.getItem(LAST_VIEW_KEY) || "null") as { path?: string; at?: number } | null;
      if (previous?.path === pathname && now - Number(previous.at || 0) < 5_000) {
        recordPageView = false;
      } else {
        window.sessionStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ path: pathname, at: now }));
      }
    } catch {
      // Session storage can be disabled. The backend still stores only a hash.
    }

    if (recordPageView) post("visit", { path: pathname });
    else post("heartbeat", {});

    const heartbeat = () => {
      if (document.visibilityState === "visible") post("heartbeat", {});
    };
    const interval = window.setInterval(heartbeat, LIVE_SESSION_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", heartbeat);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, [pathname]);

  return null;
}
