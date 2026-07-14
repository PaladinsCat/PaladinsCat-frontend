"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  SUPPORTED_LOCALES,
  type Locale,
  useLocalization,
} from "@/lib/localization-context";
import {
  getWallpaperEnabled,
  setWallpaperEnabled,
  WALLPAPER_CHANGE_EVENT,
} from "@/lib/wallpaper-preference";
import PlayerName from "@/components/player-name";

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocalization();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [headerLanguageMenuOpen, setHeaderLanguageMenuOpen] = useState(false);
  const [wallpaperEnabled, setWallpaperEnabledState] = useState(true);
  const headerLanguageMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/champions", label: t("nav.champions") },
    { href: "/players", label: t("nav.players") },
    { href: "/matches", label: t("nav.matches") },
    { href: "/stats", label: t("nav.stats") },
    { href: "/builds", label: t("nav.builds") },
    { href: "/community", label: t("nav.community") },
  ];

  const menuSections = [
    { title: t("menu.browse"), links: [{ href: "/", label: t("menu.home") }, ...navLinks] },
    {
      title: t("nav.stats"),
      links: [
        { href: "/stats", label: t("menu.globalStats") },
        { href: "/stats/winrate", label: t("menu.championWinRates") },
        { href: "/stats/banrate", label: t("menu.championBanRates") },
        { href: "/stats/talents", label: t("menu.talentPerformance") },
        { href: "/stats/loadouts", label: t("menu.loadoutMeta") },
        { href: "/stats/items", label: t("menu.itemMeta") },
        { href: "/stats/maps", label: t("menu.mapStats") },
        { href: "/stats/compositions", label: t("menu.compositionStats") },
        { href: "/stats/metrics", label: t("menu.performanceMetrics") },
        { href: "/stats/egpm", label: t("menu.effectiveCredits") },
        { href: "/stats/tiers", label: t("menu.rankedDistribution") },
        { href: "/stats/skins", label: t("menu.skinStats") },
        { href: "/stats/regions", label: t("menu.regions") },
        { href: "/stats/platforms", label: t("menu.platforms") },
      ],
    },
    {
      title: t("nav.players"),
      links: [
        { href: "/players", label: t("menu.playerHub") },
        { href: "/players/leaderboard", label: t("menu.rankedLeaderboard") },
        { href: "/players/elo", label: t("menu.eloLeaderboard") },
        { href: "/players/cheaters", label: t("menu.cheaterReports") },
        { href: "/players/suspicious", label: t("menu.suspiciousPlayers") },
        { href: "/players/weirdos", label: t("menu.weirdos") },
        { href: "/players/hall-of-fame", label: t("menu.hallOfFame") },
      ],
    },
    { title: t("menu.site"), links: [{ href: "/localization", label: t("nav.localization") }, { href: "/about", label: t("menu.about") }, { href: "/changelog", label: t("menu.changelog") }, { href: "/contact", label: t("menu.contact") }, { href: "/privacy", label: t("menu.privacy") }, { href: "/terms", label: t("menu.terms") }] },
  ];

  useEffect(() => {
    if (!sideMenuOpen && !headerLanguageMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSideMenuOpen(false);
        setHeaderLanguageMenuOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [headerLanguageMenuOpen, sideMenuOpen]);

  useEffect(() => {
    if (!headerLanguageMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!headerLanguageMenuRef.current?.contains(event.target as Node)) {
        setHeaderLanguageMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => window.removeEventListener("mousedown", closeOnOutsideClick);
  }, [headerLanguageMenuOpen]);

  useEffect(() => {
    const syncWallpaperPreference = () => setWallpaperEnabledState(getWallpaperEnabled());
    syncWallpaperPreference();
    window.addEventListener(WALLPAPER_CHANGE_EVENT, syncWallpaperPreference);
    window.addEventListener("storage", syncWallpaperPreference);
    return () => {
      window.removeEventListener(WALLPAPER_CHANGE_EVENT, syncWallpaperPreference);
      window.removeEventListener("storage", syncWallpaperPreference);
    };
  }, []);

  useEffect(() => {
    const openSiteMenu = () => setSideMenuOpen(true);
    window.addEventListener("paladinscat:open-site-menu", openSiteMenu);
    return () => window.removeEventListener("paladinscat:open-site-menu", openSiteMenu);
  }, []);

  async function handleLogout() {
    await logout();
    setSideMenuOpen(false);
  }

  function handleWallpaperToggle() {
    const next = !wallpaperEnabled;
    setWallpaperEnabledState(next);
    setWallpaperEnabled(next);
  }

  function selectHeaderLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setHeaderLanguageMenuOpen(false);
  }

  function selectSideMenuLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setSideMenuOpen(false);
  }

  const localeCode = locale.split("-")[0].toUpperCase();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isMenuActive = (href: string) => {
    if (href === "/" || href === "/stats" || href === "/players") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const profileHref = user?.linkedPlayerId ? `/players/${user.linkedPlayerId}` : "/link-account";
  const accountLabel = user ? t("nav.greeting", { username: user.linkedPlayerName ?? user.username }) : "";

  return (
    <>
      {/* Nav: sticky top, secondary bg, subtle bottom border, shadow for depth */}
      <nav className="sticky top-0 z-50 bg-pc-bg-secondary border-b border-pc-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Desktop Layout: fixed edges with a flexible link group ── */}
          <div className="hidden items-center lg:flex" style={{ height: 64 }}>
            {/* Left: fixed-width logo */}
            <div className="shrink-0">
              <Link href="/" className="text-xl font-bold text-pc-text hover:text-pc-text-muted transition-colors flex items-center gap-2">
                <img src="/images/icons/paladinscat.avif" alt="" className="w-7 h-7" />
                PaladinsCat
              </Link>
            </div>

            {/* Center: links absorb the remaining space */}
            <div className="flex min-w-0 flex-1 items-center justify-center gap-4 px-6 xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`pc-nav-link ${isActive(link.href) ? "pc-nav-link-active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: grouped menu and account controls */}
            {/* Player search lives on /players page; champion search on /champions page */}
            <div className="flex shrink-0 items-center justify-end gap-3">
              <div ref={headerLanguageMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setHeaderLanguageMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
                  aria-label={t("nav.language")}
                  aria-expanded={headerLanguageMenuOpen}
                  aria-haspopup="listbox"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>
                  {localeCode}
                  <svg className={`h-3.5 w-3.5 transition-transform ${headerLanguageMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {headerLanguageMenuOpen && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-lg border border-pc-border bg-pc-bg-secondary p-1 shadow-xl" role="listbox" aria-label={t("nav.language")}>
                    {SUPPORTED_LOCALES.map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => selectHeaderLocale(code)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${locale === code ? "bg-pc-bg-elevated text-pc-accent" : "text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-text"}`}
                        role="option"
                        aria-selected={locale === code}
                      >
                        {label}
                        <span className="text-xs text-pc-text-muted">{code.split("-")[0].toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSideMenuOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-accent"
                aria-label={t("nav.openSiteMenu")}
                aria-expanded={sideMenuOpen}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                {t("nav.menu")}
              </button>
              {user ? (
                <div className="group relative flex items-center">
                  <Link
                    href={profileHref}
                    className="block max-w-36 truncate rounded-md px-1 py-1 text-sm text-pc-text-secondary underline underline-offset-2 transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
                  >
                    {user.linkedPlayerId ? <PlayerName playerId={user.linkedPlayerId} verified>{accountLabel}</PlayerName> : accountLabel}
                  </Link>
                  <div className="pointer-events-none invisible absolute right-0 top-full z-10 w-44 pt-2 opacity-0 transition-all group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
                    <div className="rounded-lg border border-pc-border bg-pc-bg-secondary p-1 shadow-xl" role="menu">
                    <Link href={profileHref} className="block rounded-md px-3 py-2 text-sm text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-text" role="menuitem">Profile</Link>
                    <Link href="/account" className="block rounded-md px-3 py-2 text-sm text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-text" role="menuitem">Account settings</Link>
                    <button onClick={handleLogout} className="block w-full rounded-md px-3 py-2 text-left text-sm text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-text" role="menuitem">{t("nav.logout")}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="pc-btn-secondary text-sm">
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </div>

          {/* ── Mobile Layout ── */}
          <div className="flex items-center justify-between lg:hidden" style={{ height: 64 }}>
            <Link href="/" className="text-xl font-bold text-pc-text hover:text-pc-text-muted transition-colors flex items-center gap-2">
              <img src="/images/icons/paladinscat.avif" alt="" className="w-7 h-7" />
              PaladinsCat
            </Link>

            {/* Mobile hamburger button — opens the complete site menu */}
            <button
              onClick={() => setSideMenuOpen(true)}
              className="text-pc-text hover:text-pc-accent transition-colors p-2"
              aria-label="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </button>
          </div>
        </div>
      </nav>

      {sideMenuOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t("nav.menu")}>
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSideMenuOpen(false)} aria-label={t("nav.closeSiteMenu")} />
          <aside className="absolute inset-y-0 right-0 flex w-[min(24rem,calc(100vw-2rem))] flex-col border-l border-pc-border bg-pc-bg-secondary shadow-2xl">
            <div className="flex items-center justify-between border-b border-pc-border px-5 py-4">
              <Link href="/" onClick={() => setSideMenuOpen(false)} className="flex items-center gap-2 font-bold text-pc-text"><img src="/images/icons/paladinscat.avif" alt="" className="h-6 w-6" />PaladinsCat</Link>
              <button onClick={() => setSideMenuOpen(false)} className="rounded-lg p-2 text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-accent" aria-label={t("nav.closeSiteMenu")}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {menuSections.map((section) => <section key={section.title}><h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-pc-text-muted">{section.title}</h2><div className="space-y-0.5">{section.links.map((link) => <Link key={link.href} href={link.href} onClick={() => setSideMenuOpen(false)} className={`block rounded-lg px-2.5 py-2 text-sm transition-colors ${isMenuActive(link.href) ? "bg-pc-bg-elevated text-pc-accent" : "text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-text"}`}>{link.label}</Link>)}</div></section>)}
                <section>
                  <h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-pc-text-muted">{t("nav.language")}</h2>
                  <div className="overflow-hidden rounded-lg border border-pc-border bg-pc-bg p-1" role="listbox" aria-label={t("nav.language")}>
                    {SUPPORTED_LOCALES.map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => selectSideMenuLocale(code)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${locale === code ? "bg-pc-bg-elevated text-pc-accent" : "text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-text"}`}
                        role="option"
                        aria-selected={locale === code}
                      >
                        <span className="inline-flex items-center gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>{label}</span>
                        <span className="text-xs text-pc-text-muted">{code.split("-")[0].toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-pc-text-muted">{t("menu.appearance")}</h2>
                  <button
                    type="button"
                    onClick={handleWallpaperToggle}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-text"
                    aria-pressed={wallpaperEnabled}
                  >
                    <span>
                      <span className="block">{t("menu.mapWallpaper")}</span>
                      <span className="mt-0.5 block text-xs text-pc-text-muted">{wallpaperEnabled ? t("menu.enabled") : t("menu.darkGreyOnly")}</span>
                    </span>
                    <span className={`relative h-5 w-9 rounded-full transition-colors ${wallpaperEnabled ? "bg-pc-accent" : "bg-pc-bg"}`} aria-hidden="true">
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${wallpaperEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </span>
                  </button>
                </section>
              </div>
            </div>
            <div className="border-t border-pc-border px-5 py-4">
              {user ? <div className="flex items-center justify-between gap-3"><Link href={profileHref} onClick={() => setSideMenuOpen(false)} className="min-w-0 truncate text-sm text-pc-text-secondary hover:text-pc-accent">{user.linkedPlayerId ? <PlayerName playerId={user.linkedPlayerId} verified>{accountLabel}</PlayerName> : accountLabel}</Link><Link href="/account" onClick={() => setSideMenuOpen(false)} className="text-xs text-pc-text-muted hover:text-pc-accent">Account</Link><button onClick={handleLogout} className="pc-btn-ghost text-sm">{t("nav.logout")}</button></div> : <Link href="/auth/login" onClick={() => setSideMenuOpen(false)} className="pc-btn-secondary block text-center text-sm">{t("nav.login")}</Link>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
