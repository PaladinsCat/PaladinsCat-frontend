"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import { fetchChampions, type Champion, type PublicStatsScope } from "@/lib/api-client";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getRankIconPath } from "@/lib/tier-utils";
import { getStatQuality } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";
import { getStoredLobbyTierFilter } from "@/lib/lobby-tier";
import { Palette, ShieldAlert, Trophy } from "lucide-react";
import { ROUTE_CONTENT_SETTLE_MS } from "@/lib/route-transition-context";

const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

const STAT_SCOPES = [
  { value: "ranked", labelKey: "stats.scope.ranked" },
  { value: "casual", labelKey: "stats.scope.casual" },
  { value: "team_deathmatch", labelKey: "stats.scope.teamDeathmatch" },
  { value: "arcade", labelKey: "stats.scope.arcade" },
  { value: "wave_defense", labelKey: "stats.scope.waveDefense" },
  { value: "experiment", labelKey: "stats.scope.experiment" },
  { value: "newcomer", labelKey: "stats.scope.newcomer" },
  { value: "bot", labelKey: "stats.scope.bot" },
] as const;

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

function mergeChampionStats(rows: Champion[]): Champion[] {
  const statsByName = new Map(rows.map((row) => [championSlug(row.name), row]));
  return buildStaticBase().map((champion) => {
    const stats = statsByName.get(championSlug(champion.name));
    return stats ? { ...champion, ...stats, name: stats.name || champion.name } : champion;
  });
}

export default function ChampionTable({ initialChampions = null }: { initialChampions?: Champion[] | null }) {
  const { t , formatNumber} = useLocalization();
  const hasInitialChampions = Boolean(initialChampions?.length);
  const [champions, setChampions] = useState<Champion[]>(() => (
    hasInitialChampions ? mergeChampionStats(initialChampions ?? []) : buildStaticBase()
  ));
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(hasInitialChampions ? true : null); // null = checking
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "winRate" | "banRate" | "popularity">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [statsScope, setStatsScope] = useState<PublicStatsScope>("ranked");
  const deferredFilterRole = useDeferredValue(filterRole);
  const deferredSortBy = useDeferredValue(sortBy);
  const deferredSortDir = useDeferredValue(sortDir);

  // Try to fetch DB stats in the background and merge them in
  useEffect(() => {
    if (hasInitialChampions && statsScope === "ranked" && getStoredLobbyTierFilter() === "all") return;

    let cancelled = false;
    let revealTimer: number | undefined;
    const entranceStartedAt = performance.now();

    const revealAfterEntrance = (reveal: () => void) => {
      const elapsed = performance.now() - entranceStartedAt;
      const remaining = Math.max(0, ROUTE_CONTENT_SETTLE_MS - elapsed);
      revealTimer = window.setTimeout(() => {
        if (!cancelled) reveal();
      }, remaining);
    };

    async function tryFetchStats() {
      try {
        if (!hasInitialChampions || statsScope !== "ranked") {
          setDbAvailable(null);
          setChampions(buildStaticBase());
        }
        const data = await fetchChampions({ scope: statsScope });
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
          revealAfterEntrance(() => {
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
          });
        } else if (!hasInitialChampions || statsScope !== "ranked") {
          revealAfterEntrance(() => setDbAvailable(false));
        }
      } catch {
        if (!cancelled && (!hasInitialChampions || statsScope !== "ranked")) {
          revealAfterEntrance(() => setDbAvailable(false));
        }
      }
    }

    tryFetchStats();
    return () => {
      cancelled = true;
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
    };
  }, [hasInitialChampions, statsScope]);

  const filtered = useMemo(() => champions
    .filter((c) => {
      const matchesRole = !deferredFilterRole || (c.roles && c.roles.includes(deferredFilterRole));
      return matchesRole;
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
    }), [champions, deferredFilterRole, deferredSortBy, deferredSortDir]);
  const maxChampionPickRate = useMemo(
    () => Math.max(1, ...champions.map((champion) => champion.pickRate ?? 0)),
    [champions],
  );

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
        <ScrambleText text={t("generated.champions.champions")} speed={30} iterations={15} delayFromCenter={false} />
      </h1>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(32rem,0.95fr)_minmax(0,2fr)] 2xl:items-start">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 2xl:col-start-2 2xl:row-start-1">
          {[
            { href: "/stats/winrate", title: t("menu.championWinRates"), icon: Trophy, tone: "text-emerald-300" },
            { href: "/stats/banrate", title: t("menu.championBanRates"), icon: ShieldAlert, tone: "text-rose-300" },
            { href: "/stats/skins", title: t("menu.skinStats"), icon: Palette, tone: "text-violet-300" },
          ].map(({ href, title, icon: Icon, tone }) => <Link key={href} href={href} className="group flex min-h-14 items-center gap-2.5 rounded-xl border border-pc-border bg-pc-bg-elevated px-3 py-2.5 transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary"><Icon aria-hidden="true" className={`h-7 w-7 shrink-0 ${tone}`} strokeWidth={1.5} /><h2 className="min-w-0 flex-1 text-sm font-semibold leading-tight text-pc-text group-hover:text-pc-accent">{title}</h2><span className="text-pc-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pc-accent">→</span></Link>)}
        </div>

        <div className="space-y-3 2xl:col-start-1 2xl:row-start-1">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statsScope}
              onChange={(event) => {
                const next = event.target.value as PublicStatsScope;
                setStatsScope(next);
                if (next !== "ranked" && sortBy === "banRate") setSortBy("winRate");
              }}
              className="pc-select"
              aria-label={t("stats.scope.label")}
            >
              {STAT_SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{t(scope.labelKey)}</option>)}
            </select>
            <div className="flex w-full min-w-[16rem] max-w-sm flex-1 items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="pc-select min-w-0 flex-1"
              >
                <option value="name">{t("generated.champions.name")}</option>
                <option value="winRate">{t("generated.champions.winRate")}</option>
                {statsScope === "ranked" && <option value="banRate">{t("generated.champions.banRate")}</option>}
                <option value="popularity">{t("generated.champions.popularity")}</option>
              </select>
              <button
                onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                className="pc-select flex shrink-0 cursor-pointer items-center gap-1"
                title={sortDir === "asc" ? t("generated.champions.ascending") : t("generated.champions.descending")}
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
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
              if (n >= 1_000_000) return `${formatNumber((n / 1_000_000), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
              if (n >= 1_000) return `${formatNumber((n / 1_000), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
              return String(n);
            };
            const quality = c.winRate != null ? getStatQuality(c.winRate, c.pickRate, maxChampionPickRate) : null;
            return (
              <Link key={c.id} href={`/champions/${championSlug(c.name)}?scope=${statsScope}`}>
                <div
                  className="group relative flex min-h-20 items-center gap-3.5 rounded-xl border border-pc-border bg-pc-bg-elevated p-3 transition-[border-color,box-shadow,background-color] duration-200 hover:border-pc-accent-mid hover:shadow-[0_0_20px_var(--pc-accent-glow-subtle)]"
                  style={quality ? { borderColor: quality.borderColor } : undefined}
                >
                  {/* Rank icon — top right */}
                  {statsScope === "ranked" && c.rating != null && (
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

                    {/* Row 2: reserve three stable metric columns while DB stats resolve. */}
                    <div className={`grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-1 text-xs tabular-nums transition-opacity duration-300 ${dbAvailable === null ? "opacity-50" : "opacity-100"}`}>
                      <span className={`min-w-0 whitespace-nowrap ${quality?.textClass ?? "text-pc-text-muted"}`} style={quality ? { color: quality.color } : undefined}>
                        <span className="text-pc-text-muted">{t("generated.champions.wr")}</span>
                        {c.winRate != null ? t("generated.champions.value1", { value1: c.winRate }) : "—"}
                      </span>
                      {statsScope === "ranked" ? (
                        <span className={`ml-0.5 min-w-0 whitespace-nowrap ${c.banRate != null ? "text-rose-400" : "text-pc-text-muted"}`}>
                          <span className="text-pc-text-muted">{t("generated.champions.br")}</span>
                          {c.banRate != null ? t("generated.champions.value1", { value1: c.banRate }) : "—"}
                        </span>
                      ) : <span className="ml-0.5 min-w-0 whitespace-nowrap text-pc-text-muted">—</span>}
                      <span className="min-w-0 whitespace-nowrap text-right text-pc-text-muted">
                        <span>{t("generated.champions.plays")}</span>
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
