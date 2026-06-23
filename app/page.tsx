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

function notificationDot(importance: number) {
  if (importance >= 75) return "bg-amber-500";
  if (importance >= 25) return "bg-pc-accent";
  return "bg-pc-text-muted";
}

export default function HomePage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsChecked, setNotificationsChecked] = useState(false);
  const [changelogPreview, setChangelogPreview] = useState<ChangelogEntry | null>(null);

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

  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="relative z-10 min-h-screen py-8">
      {/* ── Header ── */}
      <motion.div
        initial={false}
        className="text-center mb-12"
      >
        <Image
          src="/images/icons/paladinscat.avif"
          alt="PaladinsCat logo"
          width={80}
          height={80}
          unoptimized
          preload
          fetchPriority="high"
          className="mx-auto mb-2 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        />
        <h1 className="text-4xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          <ScrambleText
            text="PaladinsCat"
            speed={30}
            iterations={15}
            delayFromCenter={false}
          />
        </h1>
        <p className="text-xs text-pc-text-secondary mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          Paladins: Comp Analytics Tool — advanced statistic, or just meow.
        </p>
      </motion.div>

      {/* ── Search Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-md mx-auto mb-16"
      >
        <form
          action="/search"
          method="GET"
          onMouseEnter={() => setSearchHovered(true)}
          onMouseLeave={() => setSearchHovered(false)}
          onSubmit={(e) => {
            const formData = new FormData(e.currentTarget);
            const query = String(formData.get("q") ?? "").trim();
            if (query === "") {
              e.preventDefault();
            }
          }}
          className="group flex items-center gap-2"
        >
          <div
            className={`pc-glass relative flex-1 rounded-lg border transition-all duration-200 ease-out hover:scale-[1.02] hover:border-pc-accent-mid hover:shadow-[0_10px_26px_rgba(51,182,177,0.14)] focus-within:scale-[1.02] focus-within:border-pc-accent-mid focus-within:shadow-[0_10px_26px_rgba(51,182,177,0.14)] ${searchHovered || searchFocused ? "scale-[1.02] border-pc-accent-mid shadow-[0_10px_26px_rgba(51,182,177,0.14)]" : "border-white/5"}`}
          >
            <input
              type="text"
              name="q"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = e.currentTarget.value.trim();
                  if (query.length > 0) {
                    e.preventDefault();
                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                  }
                }
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search players, matches, champions, items, cards, talents"
              className="w-full bg-transparent px-4 py-2 pr-10 text-sm text-pc-text outline-none rounded-lg transition-colors placeholder:text-pc-text-muted"
            />
            {searchValue.length > 0 && (
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                onClick={() => setSearchValue("")}
                className="absolute inset-y-0 right-3 flex items-center text-pc-text-muted hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="pc-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/5 text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${searchHovered || searchFocused ? "text-pc-accent" : "text-pc-text-muted group-hover:text-pc-accent group-focus-within:text-pc-accent"}`}><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </button>
        </form>
      </motion.div>

      {/* ── 2×1 Grid: Notifications | Changelog ── */}
      {notificationsChecked && (
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
                        aria-label="Dismiss"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[120px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pc-text-muted mb-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                  <p className="text-pc-text-muted text-xs text-center">No notifications</p>
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
                      <h2 className="text-sm font-bold text-pc-text">Latest Changes</h2>
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
                      View All Changes
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[120px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pc-text-muted mb-2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                  <p className="text-pc-text-muted text-xs text-center">No changelog entries yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
