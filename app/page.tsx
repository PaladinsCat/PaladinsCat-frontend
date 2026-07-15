"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import {
  fetchNotifications,
  fetchChangelogPreview,
  type Notification,
  type ChangelogEntry,
} from "@/lib/api-client";
import { formatLocalDateTime } from "@/lib/time-format";
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
  const { t } = useLocalization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsChecked, setNotificationsChecked] = useState(false);
  const [changelogPreview, setChangelogPreview] = useState<ChangelogEntry | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [homeAlertsEnabled, setHomeAlertsEnabled] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [liveNotifications, preview] = await Promise.all([
        fetchNotifications({ limit: 5 }),
        fetchChangelogPreview(),
      ]);
      setNotifications(liveNotifications);
      setChangelogPreview(preview);
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
        <h1 className="text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          <ScrambleText
            text={t("generated.page.tsx.paladinscat")}
            speed={30}
            iterations={15}
            delayFromCenter={false}
          />
        </h1>
        <p className="text-xs text-pc-text-secondary mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {t("home.tagline")}
        </p>
      </motion.div>

      {/* ── Search Bar ── */}
      <HomeSearch onSearchActiveChange={setSearchActive} />

      {/* ── 2×1 Grid: Notifications | Changelog ── */}
      {homeAlertsEnabled && !searchActive && notificationsChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Notifications */}
            <div>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="group relative flex items-start gap-3 p-3 rounded-xl bg-pc-bg-elevated border border-pc-border shadow-sm">
                      <div className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${notificationDot(notification.importance)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-pc-text-secondary text-sm leading-relaxed">{notification.message}</p>
                        <span className="text-pc-text-muted text-xs mt-1 block">
                          {formatLocalDateTime(notification.timestamp)}
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
            </div>

            {/* Right: Changelog Preview Card */}
            <div>
              {changelogPreview ? (
                <div className="bg-pc-bg-elevated border border-pc-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pc-accent shrink-0"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                      <h2 className="text-sm font-bold text-pc-text">{t("home.latestChanges")}</h2>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-pc-accent">
                        {changelogPreview.version}
                      </span>
                      {changelogPreview.gitCommitShort && (
                        <span className="text-xs font-mono text-pc-text-muted">
                          {changelogPreview.gitCommitShort}
                        </span>
                      )}
                    </div>
                    <p className="text-pc-text-secondary text-sm leading-relaxed line-clamp-4">
                      {changelogPreview.changelog}
                    </p>
                    {changelogPreview.deployedAt && (
                      <span className="text-pc-text-muted text-xs mt-2 block">
                        {formatLocalDateTime(changelogPreview.deployedAt)}
                      </span>
                    )}
                  </div>
                  <div className="px-4 pb-4">
                    <Link
                      href="/changelog"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-pc-accent hover:text-pc-accent-mid transition-colors"
                    >
                      {t("home.viewAllChanges")}
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[120px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pc-text-muted mb-2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                  <p className="text-pc-text-muted text-xs text-center">{t("home.noChangelogEntries")}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
