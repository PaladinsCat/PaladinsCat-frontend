"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  UsersRound,
} from "lucide-react";
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
  const { t, formatDateTime } = useLocalization();
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

  const exploreCards = [
    {
      href: "/players",
      icon: UsersRound,
      eyebrow: t("home.explorePlayersEyebrow"),
      title: t("home.explorePlayersTitle"),
    },
    {
      href: "/champions",
      icon: BarChart3,
      eyebrow: t("home.exploreMetaEyebrow"),
      title: t("home.exploreMetaTitle"),
    },
    {
      href: "/operations/paladinscat-bot",
      icon: Bot,
      eyebrow: t("home.exploreBotEyebrow"),
      title: t("home.exploreBotTitle"),
    },
  ];

  return (
    <div className="relative z-10 mx-auto max-w-6xl pb-8">
      <section className="py-8 sm:py-12">
        <motion.div initial={false} className="mb-12 text-center">
          <Image
            src="/images/icons/paladinscat.avif"
            alt={t("home.logoAlt")}
            width={80}
            height={80}
            unoptimized
            priority
            className="mx-auto mb-2 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
          />
          <h1 className="relative inline-block text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            <span className="text-pc-text">{t("home.brandLead")}</span>
            <span className="text-pc-accent">{t("home.brandAccent")}</span>
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
          <p className="mt-1 text-xs text-pc-text-secondary drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {t("home.tagline")}
          </p>
        </motion.div>

        <HomeSearch onSearchActiveChange={setSearchActive} />
      </section>

      <section className="mx-auto max-w-4xl px-1 py-14 sm:px-4 sm:py-20">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">
          <span className="block">{t("home.exploreTitleLead")}</span>
          <span className="mt-1 block">{t("home.exploreTitleRest")}</span>
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {exploreCards.map(({ href, icon: Icon, eyebrow, title }, index) => (
            <Link
              key={href}
              href={href}
              className="group relative flex min-h-44 flex-col items-center justify-center overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-elevated/70 p-6 text-center transition hover:-translate-y-0.5 hover:border-pc-accent-mid"
            >
              <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition group-hover:translate-x-0.5 group-hover:text-pc-accent" aria-hidden="true" />
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${index === 2 ? "border-[#786cf2]/25 bg-[#786cf2]/10 text-[#aaa3ff]" : "border-pc-accent/20 bg-pc-accent/10 text-pc-accent"}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pc-text-muted">{eyebrow}</p>
              <h3 className="mt-2 text-xl font-bold text-pc-text">{title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {homeAlertsEnabled && !searchActive && notificationsChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mx-auto max-w-xl"
        >
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="group relative flex items-start gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated/70 p-3 shadow-sm">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${notificationDot(notification.importance)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-pc-text-secondary">{notification.message}</p>
                    <span className="mt-1 block text-xs text-pc-text-muted">
                      {formatDateTime(notification.timestamp)}
                    </span>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => prev.filter((notificationItem) => notificationItem.id !== notification.id))}
                    className="mt-0.5 shrink-0 cursor-pointer rounded p-1 text-pc-text-muted opacity-0 transition-opacity hover:text-pc-text group-hover:opacity-100"
                    aria-label={t("home.dismiss")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-pc-border bg-pc-bg-elevated/70 p-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-pc-text-muted"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
              <p className="text-center text-xs text-pc-text-muted">{t("home.noNotifications")}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
