"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import { fetchChampions, type Champion } from "@/lib/api-client";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getRankIconPath, getTierColor } from "@/lib/tier-utils";
import { getStatQuality } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";
import { Palette, ShieldAlert, Trophy } from "lucide-react";

const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
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
  const { t } = useLocalization();
  const [champions, setChampions] = useState<Champion[]>(buildStaticBase);
  const [loading, setLoading] = useState(false);
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null); // null = checking
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "winRate" | "banRate" | "popularity">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredFilterRole = useDeferredValue(filterRole);
  const deferredSortBy = useDeferredValue(sortBy);
  const deferredSortDir = useDeferredValue(sortDir);
  const deferredSearchQuery = useDeferredValue(searchQuery);

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

  const filtered = useMemo(() => champions
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const matchesRole = !deferredFilterRole || (c.roles && c.roles.includes(deferredFilterRole));
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // Nulls sink to the bottom for stat sorts.
      const nullsLast = (av: number | null | undefined, bv: number | null | undefined) => {
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return deferredSortDir === "desc" ? bv - av : av - bv;
      };
      switch (deferredSortBy) {
        case "winRate":    return nullsLast(a.winRate, b.winRate);
        case "banRate":    return nullsLast(a.banRate, b.banRate);
        case "popularity": return nullsLast(a.totalPlays, b.totalPlays);
        default:           return deferredSortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
    }), [champions, deferredFilterRole, deferredSearchQuery, deferredSortBy, deferredSortDir]);
  const maxChampionPickRate = useMemo(
    () => Math.max(1, ...champions.map((champion) => champion.pickRate ?? 0)),
    [champions],
  );

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
        <ScrambleText text={t("generated.champions.champions")} speed={30} iterations={15} delayFromCenter={false} />
      </h1>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(32rem,0.95fr)_minmax(0,2fr)] 2xl:items-stretch">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 2xl:col-start-2 2xl:row-start-1">
          {[
            { href: "/stats/winrate", title: t("menu.championWinRates"), description: t("menu.winRateDescription"), icon: Trophy, tone: "text-emerald-300" },
            { href: "/stats/banrate", title: t("menu.championBanRates"), description: t("menu.banRateDescription"), icon: ShieldAlert, tone: "text-rose-300" },
            { href: "/stats/skins", title: t("menu.skinStats"), description: t("menu.skinStatsDescription"), icon: Palette, tone: "text-violet-300" },
          ].map(({ href, title, description, icon: Icon, tone }) => <Link key={href} href={href} className="group flex min-h-20 items-center gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary"><Icon aria-hidden="true" className={`h-10 w-10 shrink-0 ${tone}`} strokeWidth={1.5} /><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-pc-text group-hover:text-pc-accent">{title}</h2><p className="mt-0.5 text-xs text-pc-text-muted">{description}</p></div><span className="text-pc-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pc-accent">→</span></Link>)}
        </div>

        <div className="space-y-3 2xl:col-start-1 2xl:row-start-1">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("generated.champions.searchChampions")}
                className="pc-input w-full pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-text-muted transition-colors hover:text-pc-text"
                  aria-label={t("generated.champions.clearSearch")}
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
              <option value="name">{t("generated.champions.name")}</option>
              <option value="winRate">{t("generated.champions.winRate")}</option>
              <option value="banRate">{t("generated.champions.banRate")}</option>
              <option value="popularity">{t("generated.champions.popularity")}</option>
            </select>
            <button
              onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              className="pc-select flex cursor-pointer items-center gap-1"
              title={sortDir === "asc" ? t("generated.champions.ascending") : t("generated.champions.descending")}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* Class filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterRole(null)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
                filterRole === null
                  ? "bg-pc-accent text-pc-bg"
                  : "pc-surface text-pc-muted hover:text-pc-text"
              }`}
            >
              {t("generated.champions.all")}</button>
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setFilterRole(filterRole === r.value ? null : r.value)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
                  filterRole === r.value
                    ? "bg-pc-accent text-pc-bg"
                    : "pc-surface text-pc-muted hover:text-pc-text"
                }`}
              >
                <img src={r.icon} alt={t(r.labelKey)} className="h-5 w-5" />
                {t(r.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DB status indicator */}
      {dbAvailable === false && (
        <div className="text-pc-muted text-sm italic">
          {t("generated.champions.statsUnavailableShowingChampionListOnlyWinPickBanRates")}</div>
      )}

      {/* Champion Grid */}
      {filtered.length === 0 ? (
        <div className="pc-card text-center">
          <p className="pc-body">{t("generated.champions.noChampionsMatchedYourSearch")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filtered.map((c) => {
            const roleIcon = c.roles && c.roles.length > 0
              ? ROLES.find(r => r.value === c.roles![0])?.icon
              : undefined;
            const formatPlays = (n: number | null | undefined) => {
              if (n == null) return "—";
              if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
              if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
              return String(n);
            };
            const quality = c.winRate != null ? getStatQuality(c.winRate, c.pickRate, maxChampionPickRate) : null;
            return (
              <Link key={c.id} href={`/champions/${championSlug(c.name)}`}>
                <div
                  className="group relative flex items-center gap-3.5 p-3 rounded-xl bg-pc-bg-elevated border border-pc-border hover:border-pc-accent-mid transition-all duration-200 hover:shadow-[0_0_20px_rgba(51,182,177,0.08)]"
                  style={quality ? { borderColor: quality.borderColor } : undefined}
                >
                  {/* Rank icon — top right */}
                  {c.rating != null && (
                    <div className="absolute top-2 right-2">
                      <img
                        src={getRankIconPath(Math.round(c.rating), 0)}
                        alt={t("generated.champions.tierValue1", { value1: Math.round(c.rating) })}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  )}

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
                      <span className={quality?.textClass ?? "text-pc-text-muted"} style={quality ? { color: quality.color } : undefined}>
                        <span className="text-pc-text-muted mr-1">{t("generated.champions.wr")}</span>
                        {c.winRate != null ? t("generated.champions.value1", { value1: c.winRate }) : "—"}
                      </span>
                      <span className="text-pc-border">|</span>
                      <span className={c.banRate != null ? "text-rose-400" : "text-pc-text-muted"}>
                        <span className="text-pc-text-muted mr-1">{t("generated.champions.br")}</span>
                        {c.banRate != null ? t("generated.champions.value1", { value1: c.banRate }) : "—"}
                      </span>
                      <span className="text-pc-border">|</span>
                      <span className="text-pc-text-muted whitespace-nowrap">
                        <span className="mr-1">{t("generated.champions.plays")}</span>
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
