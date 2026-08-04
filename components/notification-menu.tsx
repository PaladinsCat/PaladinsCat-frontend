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

function publishNotificationSync() {
  window.dispatchEvent(new Event(NOTIFICATION_SYNC_EVENT));
  localStorage.setItem(NOTIFICATION_SYNC_KEY, String(Date.now()));
}

function notificationDot(importance: number) {
  if (importance >= 75) return "bg-amber-400";
  if (importance >= 25) return "bg-pc-accent";
  return "bg-pc-text-muted";
}

export default function NotificationMenu() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, formatDateTime } = useLocalization();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestSequenceRef = useRef(0);
  const signedIn = Boolean(user);

  const loadNotifications = useCallback(async () => {
    if (authLoading) return;
    const requestId = ++requestSequenceRef.current;
    try {
      const rows = signedIn
        ? await fetchAccountSiteNotifications({ limit: 8 })
        : await fetchNotifications({ limit: 8 });
      if (requestId !== requestSequenceRef.current) return;
      setNotifications(rows);
    } catch {
      // Preserve the last authenticated read state on transient failures. A
      // public-feed fallback has no per-account read markers.
    } finally {
      if (requestId === requestSequenceRef.current) setLoading(false);
    }
  }, [authLoading, signedIn]);

  useEffect(() => {
    void loadNotifications();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadNotifications();
    }, 60_000);
    return () => {
      window.clearInterval(refreshTimer);
      requestSequenceRef.current += 1;
    };
  }, [loadNotifications]);

  useEffect(() => {
    const sync = () => void loadNotifications();
    const syncStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_SYNC_KEY) sync();
    };
    const syncVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener(NOTIFICATION_SYNC_EVENT, sync);
    window.addEventListener("storage", syncStorage);
    document.addEventListener("visibilitychange", syncVisible);
    return () => {
      window.removeEventListener(NOTIFICATION_SYNC_EVENT, sync);
      window.removeEventListener("storage", syncStorage);
      document.removeEventListener("visibilitychange", syncVisible);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("mousedown", close);
      window.addEventListener("keydown", closeKeyboard);
    }
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", closeKeyboard);
    };
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await markAllSiteNotificationsRead();
      setNotifications((rows) => rows.map((r) => ({ ...r, readAt: new Date().toISOString() })));
      publishNotificationSync();
    } catch {
      /* ignore */
    }
  }, [user]);

  const markRead = useCallback(
    (notification: Notification) => {
      if (notification.readAt) return;
      if (user) {
        void markSiteNotificationRead(notification.id)
          .then(() => {
            setNotifications((rows) => rows.map((r) => (r.id === notification.id ? { ...r, readAt: new Date().toISOString() } : r)));
            publishNotificationSync();
          })
          .catch(() => {});
      }
      setNotifications((rows) => rows.map((r) => (r.id === notification.id ? { ...r, readAt: new Date().toISOString() } : r)));
    },
    [user]
  );

  const unreadCount = notifications.filter((n) => user && !n.readAt).length;
  const buttonLabel =
    unreadCount > 0
      ? t("notifications.openUnread", { count: unreadCount })
      : t("notifications.open");
  const toggleMenu = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) void loadNotifications();
  };

  const dropdownContent = (
    <div className="fixed right-4 top-[4rem] z-[70] w-[min(23rem,calc(100vw-2rem))] pt-2" style={{ maxWidth: "calc(100vw - 2rem)" }}>
      <section className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary shadow-lg" role="dialog" aria-label={t("notifications.title")}>
        <header className="flex items-center justify-between gap-3 border-b border-pc-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-pc-text">{t("notifications.title")}</h2>
            <p className="text-xs text-pc-text-muted">
              {user ? (unreadCount > 0 ? t("notifications.unread", { count: unreadCount }) : t("notifications.caughtUp")) : t("notifications.latestUpdates")}
            </p>
          </div>
          {user && unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-pc-accent transition-colors hover:bg-pc-accent/10"
            >
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
            notifications.map((notification) => {
              const unread = Boolean(user && !notification.readAt);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markRead(notification)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${unread ? "border-pc-accent/25 bg-pc-bg-elevated text-pc-text hover:border-pc-accent/45" : "border-transparent bg-pc-bg-elevated/55 text-pc-text-secondary hover:border-pc-border"}`}
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-red-500" : notificationDot(notification.importance)}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm leading-relaxed ${unread ? "font-medium" : ""}`}>{notification.message}</span>
                    <time className="mt-1 block text-xs text-pc-text-muted">{formatDateTime(notification.timestamp)}</time>
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
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

      {mounted && open && dropdownContent && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
}
