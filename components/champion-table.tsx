"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import { fetchChampions, type Champion } from "@/lib/api-client";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";

const ROLES = [
  { label: "Frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { label: "Damage",    icon: "/images/icons/Class_Damage_Icon.avif" },
  { label: "Flank",     icon: "/images/icons/Class_Flank_Icon.avif" },
  { label: "Support",   icon: "/images/icons/Class_Support_Icon.avif" },
] as const;
const TIERS = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster"] as const;

/** Build the guaranteed base list: all 59 champions, no stats. */
function buildStaticBase(): Champion[] {
  return STATIC_CHAMPIONS.map((c) => ({
    id: c.id,
    name: c.name,
    roles: c.roles,
    winRate: null,
    pickRate: null,
    banRate: null,
    rating: null,
    ratingDeviation: null,
    volatility: null,
    totalMatches: null,
    totalPlays: null,
    wins: null,
    imagePath: getChampionIconSafe(c.name),
  }));
}

export default function ChampionTable() {
  const [champions, setChampions] = useState<Champion[]>(buildStaticBase);
  const [loading, setLoading] = useState(false);
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null); // null = checking
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "winRate" | "banRate" | "popularity">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");

  // Try to fetch DB stats in the background and merge them in
  useEffect(() => {
    let cancelled = false;

    async function tryFetchStats() {
      try {
        const data = await fetchChampions();
        if (cancelled) return;

        if (data.length > 0) {
          // DB is up: merge stats into the guaranteed static champion list.
          //
          // The static fallback data predates the canonical reference import and
          // has a few punctuation differences, most visibly "Mal Damba" vs the
          // database/reference spelling "Mal'Damba".  Joining by the route slug
          // keeps the visible list durable without requiring every fallback name
          // to exactly match the live database string.
          const statsByName = new Map(data.map((d) => [championSlug(d.name), d]));
          setChampions((prev) =>
            prev.map((c) => {
              const dbData = statsByName.get(championSlug(c.name));
              if (dbData) {
                return {
                  ...c,
                  name: dbData.name || c.name,
                  winRate: dbData.winRate ?? c.winRate,
                  pickRate: dbData.pickRate ?? c.pickRate,
                  banRate: dbData.banRate ?? c.banRate,
                  rating: dbData.rating ?? c.rating,
                  totalMatches: dbData.totalMatches ?? c.totalMatches,
                  totalPlays: dbData.totalPlays ?? c.totalPlays,
                  wins: dbData.wins ?? c.wins,
                  imagePath: dbData.imagePath || c.imagePath,
                };
              }
              return c;
            })
          );
          setDbAvailable(true);
        } else {
          setDbAvailable(false);
        }
      } catch {
        if (!cancelled) setDbAvailable(false);
      }
    }

    tryFetchStats();
    return () => { cancelled = true; };
  }, []);

  const filtered = champions
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = !filterRole || (c.roles && c.roles.includes(filterRole));
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Nulls sink to the bottom for stat sorts
      const nullsLast = (av: number | null | undefined, bv: number | null | undefined) => {
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return sortDir === "desc" ? bv - av : av - bv;
      };
      switch (sortBy) {
        case "winRate":    return nullsLast(a.winRate, b.winRate);
        case "banRate":    return nullsLast(a.banRate, b.banRate);
        case "popularity": return nullsLast(a.totalPlays, b.totalPlays);
        default:           return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
    });

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
        <ScrambleText text="Champions" speed={30} iterations={15} delayFromCenter={false} />
      </h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search champions..."
            className="pc-input pr-8 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-text-muted hover:text-pc-text transition-colors"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="pc-select"
        >
          <option value="name">Name</option>
          <option value="winRate">Win Rate</option>
          <option value="banRate">Ban Rate</option>
          <option value="popularity">Popularity</option>
        </select>
        <button
          onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          className="pc-select flex items-center gap-1 cursor-pointer"
          title={sortDir === "asc" ? "Ascending" : "Descending"}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>

      {/* Class filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setFilterRole(null)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
            filterRole === null
              ? "bg-pc-accent text-pc-bg"
              : "pc-surface text-pc-muted hover:text-pc-text"
          }`}
        >
          All
        </button>
        {ROLES.map((r) => (
          <button
            key={r.label}
            onClick={() => setFilterRole(filterRole === r.label ? null : r.label)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
              filterRole === r.label
                ? "bg-pc-accent text-pc-bg"
                : "pc-surface text-pc-muted hover:text-pc-text"
            }`}
          >
            <img src={r.icon} alt={r.label} className="w-5 h-5" />
            {r.label}
          </button>
        ))}
      </div>

      {/* DB status indicator */}
      {dbAvailable === false && (
        <div className="text-pc-muted text-sm italic">
          Stats unavailable — showing champion list only. Win/pick/ban rates will appear when the database is online.
        </div>
      )}

      {/* Champion Grid */}
      {filtered.length === 0 ? (
        <div className="pc-card text-center">
          <p className="pc-body">No champions matched your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filtered.map((c) => {
            const roleIcon = c.roles && c.roles.length > 0
              ? ROLES.find(r => r.label === c.roles![0])?.icon
              : undefined;
            const formatPlays = (n: number | null | undefined) => {
              if (n == null) return "—";
              if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
              if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
              return String(n);
            };
            return (
              <Link key={c.id} href={`/champions/${championSlug(c.name)}`}>
                <div className="group relative flex items-center gap-3.5 p-3 rounded-xl bg-pc-bg-elevated border border-pc-border hover:border-pc-accent-mid transition-all duration-200 hover:shadow-[0_0_20px_rgba(51,182,177,0.08)]">
                  {/* Portrait */}
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-pc-bg-elevated flex items-center justify-center overflow-hidden border border-pc-border/50 group-hover:border-pc-accent-deep/50 transition-colors">
                    {c.imagePath ? (
                      <img src={c.imagePath} alt={c.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-pc-accent">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: name + role */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-pc-text font-semibold text-sm truncate group-hover:text-pc-accent transition-colors">
                        {c.name}
                      </h3>
                      {c.roles && c.roles.length > 0 && (
                        <span className="shrink-0 flex items-center gap-1 text-pc-text-muted text-xs px-1.5 py-0.5 rounded pc-surface-subtle">
                          {roleIcon && <img src={roleIcon} alt={c.roles[0]} className="w-3 h-3" />}
                          {c.roles[0]}
                        </span>
                      )}
                    </div>

                    {/* Row 2: stats — wraps on narrow cards */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                      <span className={c.winRate != null ? "text-emerald-400" : "text-pc-text-muted"}>
                        <span className="text-pc-text-muted mr-1">WR</span>
                        {c.winRate != null ? `${c.winRate}%` : "—"}
                      </span>
                      <span className="text-pc-border">|</span>
                      <span className={c.banRate != null ? "text-rose-400" : "text-pc-text-muted"}>
                        <span className="text-pc-text-muted mr-1">BR</span>
                        {c.banRate != null ? `${c.banRate}%` : "—"}
                      </span>
                      <span className="text-pc-border">|</span>
                      <span className="text-pc-text-muted whitespace-nowrap">
                        <span className="mr-1">Plays</span>
                        <span className="text-pc-text-secondary">{formatPlays(c.totalPlays)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
