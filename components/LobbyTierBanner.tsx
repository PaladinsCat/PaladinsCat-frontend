"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { LOBBY_TIER_OPTIONS, type LobbyTierFilter } from "@/lib/lobby-tier";

export default function LobbyTierBanner() {
  const pathname = usePathname();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { filter, definition, ready, setFilter } = useLobbyTier();

  const statisticsRoute = ["/champions", "/matches", "/stats"].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );

  if (authLoading || !isLoggedIn || !statisticsRoute) return null;

  const changeScope = (next: LobbyTierFilter) => {
    if (next === filter) return;
    setFilter(next);
    // Aggregate pages fetch on mount. Reload once so the current route cannot
    // continue showing results cached under the previous global scope.
    window.location.reload();
  };

  return (
    <div className="relative z-40 border-b border-pc-accent/20 bg-pc-bg-secondary/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-11 max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-pc-text-muted">
            Ranked stats
          </span>
          <span className="hidden h-4 w-px bg-pc-border sm:block" aria-hidden="true" />
          <span className="truncate text-xs font-semibold text-pc-accent" aria-live="polite">
            {ready ? definition.label : "Loading lobby scope…"}
          </span>
        </div>

        <div className="hidden items-center gap-1 md:flex" role="group" aria-label="Ranked lobby statistics scope">
          {LOBBY_TIER_OPTIONS.map((option) => {
            const selected = ready && option.value === filter;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => changeScope(option.value)}
                disabled={!ready}
                aria-pressed={selected}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-50 ${
                  selected
                    ? "bg-pc-accent text-pc-bg"
                    : "text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-accent"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <label className="md:hidden">
          <span className="sr-only">Ranked lobby statistics scope</span>
          <select
            value={filter}
            onChange={(event) => changeScope(event.target.value as LobbyTierFilter)}
            disabled={!ready}
            className="max-w-36 rounded-md border border-pc-border bg-pc-bg-elevated px-2 py-1 text-xs font-semibold text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50 disabled:opacity-50"
          >
            {LOBBY_TIER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <Link href="/account" className="hidden shrink-0 text-[11px] text-pc-text-muted transition-colors hover:text-pc-accent sm:inline">
          Settings
        </Link>
      </div>
    </div>
  );
}
