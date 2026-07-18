"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import {
  fetchNotifications,
  fetchSiteVersion,
  type Notification,
  type SiteVersion,
} from "@/lib/api-client";
import HomeSearch from "@/components/home-search";
import { useLocalization } from "@/lib/localization-context";
import {
  getHomeAlertsEnabled,
  HOME_ALERTS_CHANGE_EVENT,
} from "@/lib/home-alert-preference";

function notificationDot(importance: number) {
  if (importance >= 75) return "bg-amber-500";
  if (importance >= 25) return "bg-pc-accent";
  return "bg-pc-text-muted";
}

export default function HomePage() {
  const { t , formatDateTime} = useLocalization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsChecked, setNotificationsChecked] = useState(false);
  const [siteVersion, setSiteVersion] = useState<SiteVersion | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [homeAlertsEnabled, setHomeAlertsEnabled] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [liveNotifications, version] = await Promise.all([
        fetchNotifications({ limit: 5 }),
        fetchSiteVersion(),
      ]);
      setNotifications(liveNotifications);
      setSiteVersion(version);
      setNotificationsChecked(true);
    };
    load();
  }, []);

  useEffect(() => {
    const syncHomeAlertsPreference = () => setHomeAlertsEnabled(getHomeAlertsEnabled());
    syncHomeAlertsPreference();
    window.addEventListener(HOME_ALERTS_CHANGE_EVENT, syncHomeAlertsPreference);
    window.addEventListener("storage", syncHomeAlertsPreference);
    return () => {
      window.removeEventListener(HOME_ALERTS_CHANGE_EVENT, syncHomeAlertsPreference);
      window.removeEventListener("storage", syncHomeAlertsPreference);
    };
  }, []);

  return (
    <div className="relative z-10 min-h-screen py-8">
      {/* ── Header ── */}
      <motion.div
        initial={false}
        className="text-center mb-12"
      >
        <Image
          src="/images/icons/paladinscat.avif"
          alt={t("home.logoAlt")}
          width={80}
          height={80}
          unoptimized
          preload
          fetchPriority="high"
          className="mx-auto mb-2 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        />
        <h1 className="relative inline-block text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          <ScrambleText
            text={t("generated.page.tsx.paladinscat")}
            speed={30}
            iterations={15}
            delayFromCenter={false}
          />
          {siteVersion?.version && (
            <Link
              href="/changelog"
              aria-label={t("menu.changelog")}
              title={t("menu.changelog")}
              className="absolute left-full top-0 ml-1.5 whitespace-nowrap rounded-sm font-mono text-xs font-medium leading-none tracking-normal text-pc-text-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
            >
              {siteVersion.version}
            </Link>
          )}
        </h1>
        <p className="text-xs text-pc-text-secondary mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {t("home.tagline")}
        </p>
      </motion.div>

      {/* ── Search Bar ── */}
      <HomeSearch onSearchActiveChange={setSearchActive} />

      {/* ── Notifications ── */}
      {homeAlertsEnabled && !searchActive && notificationsChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="max-w-xl mx-auto"
        >
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="group relative flex items-start gap-3 p-3 rounded-xl bg-pc-bg-elevated border border-pc-border shadow-sm">
                  <div className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${notificationDot(notification.importance)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-pc-text-secondary text-sm leading-relaxed">{notification.message}</p>
                    <span className="text-pc-text-muted text-xs mt-1 block">
                      {formatDateTime(notification.timestamp)}
                    </span>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
                    className="shrink-0 mt-0.5 p-1 rounded text-pc-text-muted hover:text-pc-text opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label={t("home.dismiss")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[120px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pc-text-muted mb-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
              <p className="text-pc-text-muted text-xs text-center">{t("home.noNotifications")}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
