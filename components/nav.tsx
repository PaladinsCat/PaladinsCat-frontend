"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/champions", label: "Champions" },
    { href: "/players", label: "Players" },
    { href: "/matches", label: "Matches" },
    { href: "/stats", label: "Stats" },
    { href: "/builds", label: "Builds" },
    { href: "/community", label: "Community" },
  ];

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Nav: sticky top, secondary bg, subtle bottom border, shadow for depth */}
      <nav className="sticky top-0 z-50 bg-pc-bg-secondary border-b border-pc-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Desktop Layout: Logo (left) | Links (center) | Auth (right) ── */}
          {/* Three equal flex zones: left logo, center links, right auth */}
          <div className="hidden md:flex items-center" style={{ height: 64 }}>
            {/* Left: Logo — flex-1 gives it one-third of the space */}
            <div className="flex-1">
              <Link href="/" className="text-xl font-bold text-pc-text hover:text-pc-text-muted transition-colors flex items-center gap-2">
                <img src="/images/icons/paladinscat.avif" alt="" className="w-7 h-7" />
                PaladinsCat
              </Link>
            </div>

            {/* Center: All nav links — flex-1, centered */}
            <div className="flex-1 flex items-center justify-center gap-6">
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

            {/* Right: Auth only — flex-1 justify-end pushes it to the far right */}
            {/* Player search lives on /players page; champion search on /champions page */}
            <div className="flex-1 flex justify-end">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/account"
                    className="text-pc-text-secondary text-sm hover:text-pc-accent transition-colors underline underline-offset-2"
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
          <div className="flex md:hidden items-center justify-between" style={{ height: 64 }}>
            <Link href="/" className="text-xl font-bold text-pc-text hover:text-pc-text-muted transition-colors flex items-center gap-2">
              <img src="/images/icons/paladinscat.avif" alt="" className="w-7 h-7" />
              PaladinsCat
            </Link>

            {/* Mobile hamburger button — toggles full menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-pc-text hover:text-pc-accent transition-colors p-2"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>

          {/* ── Mobile Menu — shows all links flat ── */}
          {mobileOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-pc-bg-elevated text-pc-accent"
                      : "text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* Auth section — separated by border */}
              <div className="pt-2 border-t border-pc-border">
                {user ? (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-pc-text-secondary text-sm">Hi, {user.username}</span>
                    <button onClick={handleLogout} className="pc-btn-ghost text-sm">
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link href="/auth/login" className="block px-3 py-2 pc-btn-secondary text-sm">
                    Login
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
