/** notification-menu component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import Link from "next/link";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAccountSiteNotifications,
  fetchNotifications,
  markAllSiteNotificationsRead,
  markSiteNotificationRead,
  type Notification,
} from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

const NOTIFICATION_SYNC_KEY = "pc_notification_sync";
const NOTIFICATION_SYNC_EVENT = "pc-notification-sync";

function createPortalContainer(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "z-[70] w-[min(23rem,calc(100vw-2rem))]";
  el.style.cssText = "position:fixed;max-width:calc(100vw - 2rem);display:none;pointer-events:none";
  document.body.appendChild(el);
  return el;
}

function publishNotificationSync() {
  window.dispatchEvent(new Event(NOTIFICATION_SYNC_EVENT));
  localStorage.setItem(NOTIFICATION_SYNC_KEY, String(Date.now()));
}

function notificationDot(importance: number) {
  if (importance >= 75) return "bg-amber-400";
  if (importance >= 25) return "bg-pc-accent";
  return "bg-pc-text-muted";
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 */
export default function NotificationMenu() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, formatDateTime } = useLocalization();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const requestSequenceRef = useRef(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const signedIn = Boolean(user);

    // Whether the portal element has been created (mirrored from portalRef so the
    // render pass can read it without touching the ref during render).
    const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

    /** Position portal: centered on button, clamped to viewport edges */
  function positionPortal(btn: HTMLButtonElement, portal: HTMLDivElement) {
    const rect = btn.getBoundingClientRect();
    // Hidden button → hide portal
    if (!rect.width) {
      portal.style.display = "none";
      portal.style.pointerEvents = "none";
      return;
    }
    const dropdownW = Math.min(368, window.innerWidth - 16);
    const pad = 8;
    // Center on button
    let left = rect.left + rect.width / 2 - dropdownW / 2;
    // Clamp both edges
    left = Math.max(pad, Math.min(left, window.innerWidth - dropdownW - pad));
    portal.style.top = `${rect.bottom + 8}px`;
    portal.style.left = `${left}px`;
  }

  // Mount: create portal + cleanup
    useEffect(() => {
      portalRef.current = createPortalContainer();
      setPortalEl(portalRef.current);
      return () => {
        if (portalRef.current) portalRef.current.remove();
      };
    }, []);

  // Continuous rAF positioning while open + show/hide
  useEffect(() => {
    if (!portalRef.current) return;

    if (open) {
      portalRef.current.style.display = "";
      portalRef.current.style.pointerEvents = "auto";
      // Continuous positioning loop
      let frameId: number;
      const loop = () => {
        if (buttonRef.current && portalRef.current) {
          positionPortal(buttonRef.current, portalRef.current);
        }
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(frameId);
        document.removeEventListener("keydown", onKey);
      };
    } else {
      portalRef.current.style.display = "none";
      portalRef.current.style.pointerEvents = "none";
    }
  }, [open]);

  useEffect(() => setMounted(true), []);

  const loadNotifications = useCallback(async () => {
    if (authLoading) return;
    const id = ++requestSequenceRef.current;
    try {
      const rows = signedIn
        ? await fetchAccountSiteNotifications({ limit: 8 })
        : await fetchNotifications({ limit: 8 });
      if (id !== requestSequenceRef.current) return;
      setNotifications(rows);
    } catch {
      /* preserve state */
    } finally {
      if (id === requestSequenceRef.current) setLoading(false);
    }
  }, [authLoading, signedIn]);

  useEffect(() => {
    void loadNotifications();
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadNotifications();
    }, 60_000);
    return () => {
      window.clearInterval(t);
      requestSequenceRef.current += 1;
    };
  }, [loadNotifications]);

  useEffect(() => {
    const sync = () => void loadNotifications();
    const onStorage = (e: StorageEvent) => e.key === NOTIFICATION_SYNC_KEY && sync();
    const onVis = () => document.visibilityState === "visible" && sync();
    window.addEventListener(NOTIFICATION_SYNC_EVENT, sync);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener(NOTIFICATION_SYNC_EVENT, sync);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadNotifications]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await markAllSiteNotificationsRead();
      setNotifications((r) => r.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      publishNotificationSync();
    } catch { /* ignore */ }
  }, [user]);

  const markRead = useCallback(
    (n: Notification) => {
      if (n.readAt) return;
      if (user) {
        void markSiteNotificationRead(n.id).then(() => publishNotificationSync()).catch(() => {});
      }
      setNotifications((r) => r.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    },
    [user]
  );

  const unreadCount = notifications.filter((n) => user && !n.readAt).length;
  const buttonLabel =
    unreadCount > 0
      ? t("notifications.openUnread", { count: unreadCount })
      : t("notifications.open");

  const dropdownContent = (
    <div>
      <section className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary shadow-lg" role="dialog" aria-label={t("notifications.title")}>
        <header className="flex items-center justify-between gap-3 border-b border-pc-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-pc-text">{t("notifications.title")}</h2>
            <p className="text-xs text-pc-text-muted">
              {user ? (unreadCount > 0 ? t("notifications.unread", { count: unreadCount }) : t("notifications.caughtUp")) : t("notifications.latestUpdates")}
            </p>
          </div>
          {user && unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-pc-accent transition-colors hover:bg-pc-accent/10">
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </header>
        <div className="max-h-[min(30rem,calc(100vh-7rem))] space-y-2 overflow-y-auto p-2">
          {loading ? (
            <div className="flex min-h-28 items-center justify-center text-pc-text-muted">
              <LoaderCircle className="h-5 w-5 animate-spin" aria-label={t("notifications.loading")} />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => {
              const unread = Boolean(user && !n.readAt);
              return (
                <button key={n.id} type="button" onClick={() => markRead(n)} className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${unread ? "border-pc-accent/25 bg-pc-bg-elevated text-pc-text hover:border-pc-accent/45" : "border-transparent hover:bg-pc-bg-elevated/50"}`}>
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-red-500" : notificationDot(n.importance)}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm leading-relaxed ${unread ? "font-medium" : ""}`}>{n.message}</span>
                    <time className="mt-1 block text-xs text-pc-text-muted">{formatDateTime(n.timestamp)}</time>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-8 text-center text-sm text-pc-text-muted">{t("notifications.empty")}</p>
          )}
        </div>
        {!user && !loading && (
          <div className="border-t border-pc-border px-4 py-3 text-xs text-pc-text-muted">
            <Link href="/auth/login" onClick={() => setOpen(false)} className="font-medium text-pc-accent hover:text-pc-accent-light">
              {t("notifications.login")}
            </Link>{" "}{t("notifications.loginSuffix")}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent ${open ? "bg-pc-bg-elevated text-pc-accent" : ""}`}
        aria-label={buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-pc-bg-secondary" aria-hidden="true" />
        )}
      </button>
      {mounted && open && portalEl && ReactDOM.createPortal(dropdownContent, portalEl)}
    </div>
  );
}
