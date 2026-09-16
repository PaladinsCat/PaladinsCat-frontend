/**
 * Render the PlayerChampionStatsPage view for the player id champions page route.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { EmptyState, ErrorState, LoadingIndicator, LoadingPanel } from "@/components/async-state";
import PlayersPageHeader from "@/components/ui/players-page-header";
import PlayerTrendsPanel from "@/components/player-trends";
import { fetchPlayerChampionStats, refreshPlayerChampionStats, type PlayerChampionCumulativeMetrics, type PlayerChampionStat } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championMasteryLevelFromXp } from "@/lib/champion-mastery";
import { formatKda } from "@/lib/kda";
import { getPercentageColor } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";
import type { PlayerChampionScope } from "@/lib/api-client";


const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

const CHAMPION_METRICS = [
  { key: "dpm", labelKey: "common.metrics.dpm" },
  { key: "wpm", labelKey: "common.metrics.wpm" },
  { key: "apm", labelKey: "common.metrics.apm" },
  { key: "hpm", labelKey: "common.metrics.hpm" },
  { key: "shpm", labelKey: "common.metrics.shpm" },
  { key: "spm", labelKey: "common.metrics.spm" },
  { key: "gpm", labelKey: "common.metrics.gpm" },
  { key: "egpm", labelKey: "common.metrics.egpm" },
  { key: "kpm", labelKey: "common.metrics.kpm" },
  { key: "deaths_per_minute", labelKey: "common.metrics.deathsPerMinute" },
] as const satisfies ReadonlyArray<{ key: keyof PlayerChampionCumulativeMetrics; labelKey: string }>;

type SortKey = "level" | "matches" | "winRate" | "rating";

function metricComparison(value: number | null, global: number | null): number | null {
  if (value == null || global == null || global <= 0) return null;
  return ((value - global) / global) * 100;
}

function metricComparisonColor(value: number | null): string | undefined {
  if (value == null) return undefined;
  const bounded = Math.max(-100, Math.min(100, value));
  return getPercentageColor((bounded + 100) / 2);
}

/**
 * Render the PlayerChampionStatsPage view for the player id champions page route.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function PlayerChampionStatsPage() {
  const { formatDateTime, formatDuration, formatNumber, formatRecord, formatSignedPercent, t } = useLocalization();
  const params = useParams<{ id: string }>();
  const playerId = String(params.id ?? "");
  const [stats, setStats] = useState<PlayerChampionStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [scope, setScope] = useState<PlayerChampionScope>("ranked");
  const [expandedChampions, setExpandedChampions] = useState<Set<number>>(() => new Set());
  const [sortBy, setSortBy] = useState<SortKey>("level");
  const [sortDescending, setSortDescending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshRemainingSeconds, setRefreshRemainingSeconds] = useState(0);

  const load = useCallback(async () => {
    if (!playerId) return;
    setError(null);
    try {
      setStats(await fetchPlayerChampionStats(playerId, scope));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load champion stats.");
    }
  }, [playerId, scope]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const lastUpdated = stats?.reduce<number | null>((latest, champion) => {
      const timestamp = champion.lastUpdated ? new Date(champion.lastUpdated).getTime() : Number.NaN;
      return Number.isFinite(timestamp) && (latest === null || timestamp > latest) ? timestamp : latest;
    }, null) ?? null;
    if (lastUpdated === null) {
      setRefreshRemainingSeconds(0);
      return;
    }
    const updateRemaining = () => setRefreshRemainingSeconds(Math.max(0, Math.ceil((lastUpdated + 3 * 60 * 1000 - Date.now()) / 1000)));
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [stats]);

  const refresh = async () => {
    if (refreshRemainingSeconds > 0) return;
    setRefreshing(true);
    setError(null);
    try {
      const response = await refreshPlayerChampionStats(playerId);
      setRefreshRemainingSeconds(response.freshness.remaining_seconds);
      setStats(await fetchPlayerChampionStats(playerId, scope));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh champion stats.");
    } finally {
      setRefreshing(false);
    }
  };

  const champions = useMemo(() => (stats ?? [])
    .filter((champion) => !filterRole || champion.role === filterRole)
    .sort((a, b) => {
      const direction = sortDescending ? -1 : 1;
      const values: Record<SortKey, [number, number]> = {
        level: [championMasteryLevelFromXp(a.xp), championMasteryLevelFromXp(b.xp)],
        matches: [a.matchesPlayed, b.matchesPlayed],
        winRate: [a.winRate ?? -1, b.winRate ?? -1],
        rating: [a.rating ?? -1, b.rating ?? -1],
      };
      const [left, right] = values[sortBy];
      return direction * (left - right)
        || (sortBy === "level" ? direction * (a.xp - b.xp) : 0)
        || a.championName.localeCompare(b.championName);
    }), [filterRole, sortBy, sortDescending, stats]);

  const summary = useMemo(() => {
    const active = (stats ?? []).filter((champion) => champion.matchesPlayed > 0);
    const matches = active.reduce((total, champion) => total + champion.matchesPlayed, 0);
    const wins = active.reduce((total, champion) => total + champion.wins, 0);
    return {
      active,
      matches,
      winRate: matches > 0 ? (wins / matches) * 100 : 0,
    };
  }, [stats]);

  const classCumulative = useMemo(() => ROLES.map((role) => {
    const members = (stats ?? []).filter((champion) => champion.role === role.value);
    const lastPlayed = members.reduce<string | null>((latest, champion) => {
      if (!champion.lastPlayed) return latest;
      if (!latest || Date.parse(champion.lastPlayed) > Date.parse(latest)) return champion.lastPlayed;
      return latest;
    }, null);
    return {
      ...role,
      championCount: members.length,
      xp: members.reduce((total, champion) => total + champion.xp, 0),
      matches: members.reduce((total, champion) => total + champion.matchesPlayed, 0),
      wins: members.reduce((total, champion) => total + champion.wins, 0),
      losses: members.reduce((total, champion) => total + champion.losses, 0),
      kills: members.reduce((total, champion) => total + champion.kills, 0),
      deaths: members.reduce((total, champion) => total + champion.deaths, 0),
      assists: members.reduce((total, champion) => total + champion.assists, 0),
      gold: members.reduce((total, champion) => total + champion.gold, 0),
      minutesPlayed: members.reduce((total, champion) => total + champion.minutesPlayed, 0),
      lastPlayed,
    };
  }), [stats]);

  const ratingChart = useMemo(() => [...summary.active]
    .filter((champion) => champion.rating != null && champion.ratingDeviation != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 10), [summary.active]);

  if (!stats && !error) return <LoadingPanel />;
  if (error && !stats) return <ErrorState title={t("generated.players.championUnavailable")} message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PlayersPageHeader
        title={t("common.playerChampions.title")}
        actions={<button type="button" onClick={refresh} disabled={refreshing || refreshRemainingSeconds > 0} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs font-semibold text-pc-text hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-50">{refreshing ? <LoadingIndicator className="gap-2" /> : refreshRemainingSeconds > 0 ? t("generated.players.refreshInValue1", { value1: formatDuration(refreshRemainingSeconds) }) : t("common.playerChampions.refresh")}</button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {([
          [t("generated.champions.champions"), formatNumber(summary.active.length)],
          [t("generated.players.matches"), formatNumber(summary.matches)],
          [t("common.metrics.winRate"), t("common.playerChampions.winPercentage", { value: formatNumber(summary.winRate, { maximumFractionDigits: 1 }) })],
        ] as const).map(([label, value]) => (
          <div key={label} className="pc-glass rounded-xl p-4">
            <div className="text-xs uppercase tracking-wide text-pc-text-muted">{label}</div>
            <div className="mt-1 text-xl font-semibold text-pc-text">{value}</div>
          </div>
        ))}
      </div>

      <PlayerTrendsPanel playerId={playerId} champions />

      <section data-testid="class-cumulative-stats" className="pc-glass rounded-xl p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="pc-card-title">{t("generated.players.overall")} {t("generated.champions.class.41ff354")}</h2>
          </div>
        </div>
        <div className="pc-card-flush overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-pc-border bg-pc-bg-secondary text-left text-xs uppercase tracking-wide text-pc-text-muted">
                <th className="px-1.5 py-2">{t("generated.champions.class.41ff354")}</th>
                <th className="px-1.5 py-2">{t("generated.players.totalXp")}</th>
                <th className="px-1.5 py-2">{t("generated.players.totalMatches")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.winsLosses")}</th>
                <th className="px-1.5 py-2">{t("common.metrics.winRate")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.kdaShort")}</th>
                <th className="px-1.5 py-2">{t("common.metrics.kda")}</th>
                <th className="px-1.5 py-2">{t("generated.app.stats.page.gold")}</th>
                <th className="px-1.5 py-2">{t("generated.players.playtime")}</th>
                <th className="px-1.5 py-2">{t("generated.players.lastObserved")}</th>
              </tr>
            </thead>
            <tbody>
              {classCumulative.map((classTotal) => {
                const winRate = classTotal.matches > 0 ? (classTotal.wins / classTotal.matches) * 100 : null;
                return (
                  <tr key={classTotal.value} className="border-b border-pc-border/50 last:border-0 hover:bg-pc-bg-secondary">
                    <th scope="row" className="whitespace-nowrap px-1.5 py-2 text-left font-semibold text-pc-text"><span className="flex items-center gap-1.5"><img src={classTotal.icon} alt="" className="h-5 w-5 shrink-0" />{t(classTotal.labelKey)} <span className="font-normal text-pc-text-muted">({formatNumber(classTotal.championCount)})</span></span></th>
                    <td className="px-1.5 py-2 font-mono text-xs text-pc-text-secondary">{formatNumber(classTotal.xp)}</td>
                    <td className="px-1.5 py-2 font-mono text-xs text-pc-text-secondary">{formatNumber(classTotal.matches)}</td>
                    <td className="px-1.5 py-2 font-mono text-xs text-pc-text-secondary">{formatRecord(classTotal.wins, classTotal.losses)}</td>
                    <td className="px-1.5 py-2 font-mono text-xs text-pc-text-secondary">{winRate == null ? "—" : t("common.playerChampions.winPercentage", { value: formatNumber(winRate) })}</td>
                    <td className="whitespace-nowrap px-1.5 py-2 font-mono text-xs text-pc-text-secondary">{t("common.playerChampions.kdaLine", { kills: formatNumber(classTotal.kills), deaths: formatNumber(classTotal.deaths), assists: formatNumber(classTotal.assists) })}</td>
                    <td className="px-1.5 py-2 font-mono text-xs text-pc-text-secondary" title={t("common.metricHelp.kda")}>{formatKda(classTotal.kills, classTotal.deaths, classTotal.assists)}</td>
                    <td className="px-1.5 py-2 font-mono text-xs text-pc-text-secondary">{formatNumber(classTotal.gold)}</td>
                    <td className="whitespace-nowrap px-1.5 py-2 font-mono text-xs text-pc-text-secondary">{formatDuration(classTotal.minutesPlayed * 60)}</td>
                    <td className="whitespace-nowrap px-1.5 py-2 text-xs text-pc-text-secondary">{classTotal.lastPlayed ? <time dateTime={classTotal.lastPlayed}>{formatDateTime(classTotal.lastPlayed)}</time> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {scope === "ranked" && <div className="grid gap-4">
        <section className="pc-glass rounded-xl p-4">
          <h2 className="pc-card-title">{t("generated.players.championRatings")}</h2>
          <p className="mt-1 text-xs text-pc-text-muted">{t("generated.players.rating")} · {t("generated.players.deviation")} · {t("generated.players.volatility")}</p>
          {ratingChart.length === 0 ? <EmptyState title={t("generated.stats.noRatingDataAvailable")} /> : (
            <div className="mt-4 space-y-3">
              {ratingChart.map((champion) => {
                const rating = champion.rating ?? 0;
                const deviation = champion.ratingDeviation ?? 0;
                const rangeStart = Math.max(0, Math.min(100, ((rating - deviation - 500) / 2500) * 100));
                const rangeEnd = Math.max(rangeStart, Math.min(100, ((rating + deviation - 500) / 2500) * 100));
                const marker = Math.max(0, Math.min(100, ((rating - 500) / 2500) * 100));
                return (
                  <div key={champion.championId} className="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-xs">
                    <span className="truncate text-pc-text">{champion.championName}</span>
                    <div className="relative h-2.5 rounded-full bg-pc-bg-secondary" aria-hidden="true">
                      <div className="absolute inset-y-0 rounded-full bg-pc-accent/25" style={{ left: `${rangeStart}%`, width: `${Math.max(1, rangeEnd - rangeStart)}%` }} />
                      <div className="absolute -top-1 h-4 w-1 rounded bg-pc-accent" style={{ left: `${marker}%` }} />
                    </div>
                    <span className="min-w-24 text-right font-mono text-pc-text-secondary">{formatNumber(rating)} ± {formatNumber(deviation)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>}

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFilterRole(null)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${filterRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>{t("generated.champions.all")}</button>
          {ROLES.map((role) => <button key={role.value} type="button" onClick={() => setFilterRole(filterRole === role.value ? null : role.value)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${filterRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
          <label className="ml-2 grid gap-1 text-xs text-pc-text-secondary">
            {t("stats.scope.label")}
            <select value={scope} onChange={(event) => { setStats(null); setScope(event.target.value as PlayerChampionScope); setExpandedChampions(new Set()); }} className="pc-select">
              <option value="ranked">{t("stats.scope.ranked")}</option>
              <option value="casual">{t("stats.scope.casual")}</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="pc-select">
            <option value="level">{t("common.playerChampions.sortLevel")}</option>
            <option value="matches">{t("generated.players.matches")}</option>
            <option value="winRate">{t("common.metrics.winRate")}</option>
            <option value="rating">{t("generated.players.rating")}</option>
          </select>
          <button type="button" onClick={() => setSortDescending((descending) => !descending)} className="pc-select flex cursor-pointer items-center gap-1" title={sortDescending ? t("generated.champions.descending") : t("generated.champions.ascending")}>{sortDescending ? "↓" : "↑"}</button>
        </div>
      </div>

      {champions.length === 0 ? <EmptyState title={t("common.playerChampions.empty")} /> : (
        <div className="pc-card-flush overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-pc-border bg-pc-bg-secondary text-left text-xs uppercase tracking-wide text-pc-text-muted">
                <th className="px-1.5 py-2">{t("common.playerChampions.champion")}</th>
                <th className="px-1.5 py-2">{t("generated.players.lvl")}</th>
                <th className="px-1.5 py-2">{t("generated.players.championXp")}</th>
                <th className="px-1.5 py-2">{t("generated.players.matches")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.winsShort")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.lossesShort")}</th>
                <th className="px-1.5 py-2">{t("common.metrics.winRate")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.kdaShort")}</th>
                <th className="px-1.5 py-2">{t("common.metrics.kda")}</th>
                <th className="px-1.5 py-2">{t("generated.app.stats.page.gold")}</th>
                <th className="px-1.5 py-2">{t("generated.players.playtime")}</th>
                <th className="px-1.5 py-2">{t("generated.players.lastObserved")}</th>
                <th className="px-1.5 py-2">{t("generated.players.rating")}</th>
              </tr>
            </thead>
            <tbody>
              {champions.map((champion) => {
                const expanded = expandedChampions.has(champion.championId);
                const detailsId = `champion-${champion.championId}-metrics`;
                return (
                <Fragment key={champion.championId}>
                  <tr className="hover:bg-pc-bg-secondary">
                    <td className="px-1.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <img src={getChampionIconSafe(champion.championName)} alt="" className="h-5 w-5 shrink-0 rounded object-contain" />
                        <span className="font-medium text-pc-text">{champion.championName}</span>
                        <button type="button" aria-expanded={expanded} aria-controls={detailsId} aria-label={`${t(expanded ? "generated.matches.collapse" : "generated.matches.expand")} ${t("generated.matches.details")}`} onClick={() => setExpandedChampions((current) => { const next = new Set(current); if (next.has(champion.championId)) next.delete(champion.championId); else next.add(champion.championId); return next; })} className="ml-auto rounded px-1 text-pc-text-secondary hover:bg-pc-bg-elevated hover:text-pc-accent">{expanded ? "▾" : "▸"}</button>
                      </div>
                    </td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-accent">{championMasteryLevelFromXp(champion.xp)}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.xp)}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.matchesPlayed)}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.wins)}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.losses)}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs">{champion.winRate != null ? (
                      <span className="font-medium" style={{ color: getPercentageColor(champion.winRate) }}>{t("common.playerChampions.winPercentage", { value: formatNumber(champion.winRate) })}</span>
                    ) : "—"}</td>
                    <td className="whitespace-nowrap px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{t("common.playerChampions.kdaLine", { kills: formatNumber(champion.kills), deaths: formatNumber(champion.deaths), assists: formatNumber(champion.assists) })}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary" title={t("common.metricHelp.kda")}>{formatKda(champion.kills, champion.deaths, champion.assists)}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.gold)}</td>
                    <td className="whitespace-nowrap px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatDuration(champion.minutesPlayed * 60)}</td>
                    <td className="whitespace-nowrap px-1.5 py-1.5 text-xs text-pc-text-secondary">{champion.lastPlayed ? <time dateTime={champion.lastPlayed}>{formatDateTime(champion.lastPlayed)}</time> : "—"}</td>
                    <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{champion.rating != null ? formatNumber(champion.rating) : "—"}</td>
                  </tr>
                  {expanded && <tr id={detailsId} className="border-b border-pc-border/50 last:border-0">
                    <td colSpan={13} className="px-1.5 pb-2 pt-0.5">
                      <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 pl-8 text-xs leading-4 text-pc-text-muted sm:grid-cols-8">
                        {CHAMPION_METRICS.map((metric) => (
                          <span key={metric.key} className="whitespace-nowrap">
                            <span className="font-semibold text-pc-text-secondary">{t(metric.labelKey)}</span> {champion.cumulativeMetrics[metric.key] == null ? "—" : formatNumber(champion.cumulativeMetrics[metric.key] ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ))}
                      </div>
                      <div className="mt-0.5 grid grid-cols-4 gap-x-2 gap-y-0.5 pl-8 text-xs leading-4 text-pc-text-muted sm:grid-cols-8" title={t("generated.stats.vsGlobal")}>
                        {CHAMPION_METRICS.map((metric) => {
                          const comparison = metricComparison(champion.cumulativeMetrics[metric.key], champion.globalMetrics[metric.key]);
                          return (
                            <span key={metric.key} className="whitespace-nowrap" style={{ color: metricComparisonColor(metric.key === "deaths_per_minute" && comparison != null ? -comparison : comparison) }}>
                              <span className="font-semibold text-pc-text-secondary">{t(metric.labelKey)}</span> {formatSignedPercent(comparison, { maximumFractionDigits: 0 })}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
