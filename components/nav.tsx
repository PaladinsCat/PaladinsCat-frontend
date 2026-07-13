"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getWallpaperEnabled,
  setWallpaperEnabled,
  WALLPAPER_CHANGE_EVENT,
} from "@/lib/wallpaper-preference";

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [wallpaperEnabled, setWallpaperEnabledState] = useState(true);

  const navLinks = [
    { href: "/champions", label: "Champions" },
    { href: "/players", label: "Players" },
    { href: "/matches", label: "Matches" },
    { href: "/stats", label: "Stats" },
    { href: "/builds", label: "Builds" },
    { href: "/community", label: "Community" },
  ];

  const menuSections = [
    { title: "Browse", links: [{ href: "/", label: "Home" }, ...navLinks] },
    {
      title: "Stats",
      links: [
        { href: "/stats", label: "Global Stats" },
        { href: "/stats/winrate", label: "Champion Win Rates" },
        { href: "/stats/banrate", label: "Champion Ban Rates" },
        { href: "/stats/talents", label: "Talent Performance" },
        { href: "/stats/loadouts", label: "Loadout Meta" },
        { href: "/stats/items", label: "Item Meta" },
        { href: "/stats/maps", label: "Map Stats" },
        { href: "/stats/compositions", label: "Composition Stats" },
        { href: "/stats/metrics", label: "Performance Metrics" },
        { href: "/stats/egpm", label: "Effective Credits (eCPM)" },
        { href: "/stats/tiers", label: "Ranked Player Distribution" },
        { href: "/stats/skins", label: "Skin Stats" },
        { href: "/stats/regions", label: "Regions" },
        { href: "/stats/platforms", label: "Platforms" },
      ],
    },
    {
      title: "Players",
      links: [
        { href: "/players", label: "Player Hub" },
        { href: "/players/leaderboard", label: "Ranked Leaderboard" },
        { href: "/players/elo", label: "ELO Leaderboard" },
        { href: "/players/cheaters", label: "Cheater Reports" },
        { href: "/players/suspicious", label: "Suspicious Players" },
        { href: "/players/weirdos", label: "Weirdos" },
        { href: "/players/hall-of-fame", label: "Hall of Fame" },
      ],
    },
    { title: "Site", links: [{ href: "/about", label: "About" }, { href: "/changelog", label: "Changelog" }, { href: "/contact", label: "Contact" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }] },
  ];

  useEffect(() => {
    if (!sideMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSideMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sideMenuOpen]);

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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isMenuActive = (href: string) => {
    if (href === "/" || href === "/stats" || href === "/players") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
              <button
                onClick={() => setSideMenuOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-accent"
                aria-label="Open site menu"
                aria-expanded={sideMenuOpen}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                Menu
              </button>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/account"
                    className="max-w-32 truncate text-sm text-pc-text-secondary underline underline-offset-2 transition-colors hover:text-pc-accent"
                  >
                    Hi, {user.username}
                  </Link>
                  <button onClick={handleLogout} className="pc-btn-ghost text-sm">
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/auth/login" className="pc-btn-secondary text-sm">
                  Login
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
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Site menu">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSideMenuOpen(false)} aria-label="Close site menu" />
          <aside className="absolute inset-y-0 right-0 flex w-[min(24rem,calc(100vw-2rem))] flex-col border-l border-pc-border bg-pc-bg-secondary shadow-2xl">
            <div className="flex items-center justify-between border-b border-pc-border px-5 py-4">
              <Link href="/" onClick={() => setSideMenuOpen(false)} className="flex items-center gap-2 font-bold text-pc-text"><img src="/images/icons/paladinscat.avif" alt="" className="h-6 w-6" />PaladinsCat</Link>
              <button onClick={() => setSideMenuOpen(false)} className="rounded-lg p-2 text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-accent" aria-label="Close site menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {menuSections.map((section) => <section key={section.title}><h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-pc-text-muted">{section.title}</h2><div className="space-y-0.5">{section.links.map((link) => <Link key={link.href} href={link.href} onClick={() => setSideMenuOpen(false)} className={`block rounded-lg px-2.5 py-2 text-sm transition-colors ${isMenuActive(link.href) ? "bg-pc-bg-elevated text-pc-accent" : "text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-text"}`}>{link.label}</Link>)}</div></section>)}
                <section>
                  <h2 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-pc-text-muted">Appearance</h2>
                  <button
                    type="button"
                    onClick={handleWallpaperToggle}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-text"
                    aria-pressed={wallpaperEnabled}
                  >
                    <span>
                      <span className="block">Map wallpaper</span>
                      <span className="mt-0.5 block text-xs text-pc-text-muted">{wallpaperEnabled ? "Enabled" : "Dark grey only"}</span>
                    </span>
                    <span className={`relative h-5 w-9 rounded-full transition-colors ${wallpaperEnabled ? "bg-pc-accent" : "bg-pc-bg"}`} aria-hidden="true">
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${wallpaperEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                    </span>
                  </button>
                </section>
              </div>
            </div>
            <div className="border-t border-pc-border px-5 py-4">
              {user ? <div className="flex items-center justify-between"><Link href="/account" onClick={() => setSideMenuOpen(false)} className="text-sm text-pc-text-secondary hover:text-pc-accent">Hi, {user.username}</Link><button onClick={handleLogout} className="pc-btn-ghost text-sm">Logout</button></div> : <Link href="/auth/login" onClick={() => setSideMenuOpen(false)} className="pc-btn-secondary block text-center text-sm">Login</Link>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
