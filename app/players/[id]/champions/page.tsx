/**
 * Define the player route surface for id champions page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, ErrorState, LoadingIndicator, LoadingPanel } from "@/components/async-state";
import PlayersPageHeader from "@/components/ui/players-page-header";
import { fetchPlayerChampionStats, refreshPlayerChampionStats, type PlayerChampionStat } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championMasteryLevelFromXp } from "@/lib/champion-mastery";
import { calculateKda, formatKda } from "@/lib/kda";
import { getPercentageColor } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";


const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

type SortKey = "level" | "kda" | "winRate" | "playTime" | "rating";

/**
 * Render the PlayerChampionStatsPage view for the player id champions page route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PlayerChampionStatsPage() {
  const { formatDuration, formatNumber, t } = useLocalization();
  const params = useParams<{ id: string }>();
  const playerId = String(params.id ?? "");
  const [stats, setStats] = useState<PlayerChampionStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("level");
  const [sortDescending, setSortDescending] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshRemainingSeconds, setRefreshRemainingSeconds] = useState(0);

  const load = useCallback(async () => {
    if (!playerId) return;
    setError(null);
    try {
      setStats(await fetchPlayerChampionStats(playerId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load champion stats.");
    }
  }, [playerId]);

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
      setStats(await fetchPlayerChampionStats(playerId));
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
        kda: [calculateKda(a.kills, a.deaths, a.assists), calculateKda(b.kills, b.deaths, b.assists)],
        winRate: [a.winRate ?? -1, b.winRate ?? -1],
        playTime: [a.minutesPlayed, b.minutesPlayed],
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
      minutes: active.reduce((total, champion) => total + champion.minutesPlayed, 0),
      winRate: matches > 0 ? (wins / matches) * 100 : 0,
    };
  }, [stats]);

  const performanceChart = useMemo(() => [...summary.active]
    .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
    .slice(0, 10), [summary.active]);

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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          [t("generated.champions.champions"), formatNumber(summary.active.length)],
          [t("generated.players.matches"), formatNumber(summary.matches)],
          [t("common.metrics.winRate"), t("common.playerChampions.winPercentage", { value: formatNumber(summary.winRate, { maximumFractionDigits: 1 }) })],
          [t("generated.players.playtime"), t("common.format.minutesShort", { minutes: formatNumber(summary.minutes) })],
        ] as const).map(([label, value]) => (
          <div key={label} className="pc-glass rounded-xl p-4">
            <div className="text-xs uppercase tracking-wide text-pc-text-muted">{label}</div>
            <div className="mt-1 text-xl font-semibold text-pc-text">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="pc-glass rounded-xl p-4">
          <h2 className="pc-card-title">{t("generated.players.rankedPerformance")}</h2>
          <p className="mt-1 text-xs text-pc-text-muted">{t("common.metrics.winRate")} · {t("generated.players.matches")}</p>
          <div className="mt-4 space-y-3">
            {performanceChart.map((champion) => (
              <div key={champion.championId} className="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2 text-pc-text">
                  <img src={getChampionIconSafe(champion.championName)} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
                  <span className="truncate">{champion.championName}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-pc-bg-secondary" aria-hidden="true">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, champion.winRate ?? 0))}%`, background: getPercentageColor(champion.winRate) }} />
                </div>
                <div className="min-w-16 text-right font-mono" style={{ color: getPercentageColor(champion.winRate) }}>{formatNumber(champion.winRate ?? 0, { maximumFractionDigits: 1 })}% · {formatNumber(champion.matchesPlayed)}</div>
              </div>
            ))}
          </div>
        </section>

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
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFilterRole(null)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${filterRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>{t("generated.champions.all")}</button>
          {ROLES.map((role) => <button key={role.value} type="button" onClick={() => setFilterRole(filterRole === role.value ? null : role.value)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${filterRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="pc-select">
            <option value="level">{t("common.playerChampions.sortLevel")}</option>
            <option value="kda">{t("common.metrics.kda")}</option>
            <option value="winRate">{t("common.metrics.winRate")}</option>
            <option value="playTime">{t("generated.players.playtime")}</option>
            <option value="rating">{t("generated.players.rating")}</option>
          </select>
          <button type="button" onClick={() => setSortDescending((descending) => !descending)} className="pc-select flex cursor-pointer items-center gap-1" title={sortDescending ? t("generated.champions.descending") : t("generated.champions.ascending")}>{sortDescending ? "↓" : "↑"}</button>
        </div>
      </div>

      {champions.length === 0 ? <EmptyState title={t("common.playerChampions.empty")} /> : (
        <div className="pc-card-flush overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-pc-border bg-pc-bg-secondary text-left text-xs uppercase tracking-wide text-pc-text-muted">
                <th className="px-1.5 py-2">{t("common.playerChampions.champion")}</th>
                <th className="px-1.5 py-2">{t("generated.players.lvl")}</th>
                <th className="px-1.5 py-2">{t("generated.players.championXp")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.kdaShort")}</th>
                <th className="px-1.5 py-2">{t("common.metrics.kdaRatio")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.winsShort")}</th>
                <th className="px-1.5 py-2">{t("common.playerChampions.lossesShort")}</th>
                <th className="px-1.5 py-2">{t("common.metrics.winRate")}</th>
                <th className="px-1.5 py-2">{t("generated.players.rating")}</th>
                <th className="px-1.5 py-2">{t("generated.players.deviation")}</th>
                <th className="px-1.5 py-2">{t("generated.players.volatility")}</th>
                <th className="px-1.5 py-2">{t("generated.players.playtime")}</th>
              </tr>
            </thead>
            <tbody>
              {champions.map((champion) => (
                <tr key={champion.championId} className="border-b border-pc-border/50 last:border-0 hover:bg-pc-bg-secondary">
                  <td className="px-1.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <img src={getChampionIconSafe(champion.championName)} alt="" className="h-5 w-5 shrink-0 rounded object-contain" />
                      <span className="font-medium text-pc-text">{champion.championName}</span>
                    </div>
                  </td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-accent">{championMasteryLevelFromXp(champion.xp)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.xp)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.kills)}/{formatNumber(champion.deaths)}/{formatNumber(champion.assists)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatKda(champion.kills, champion.deaths, champion.assists)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.wins)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{formatNumber(champion.losses)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs">{champion.winRate != null ? (
                    <span className="font-medium" style={{ color: getPercentageColor(champion.winRate) }}>{t("common.playerChampions.winPercentage", { value: formatNumber(champion.winRate) })}</span>
                  ) : "—"}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{champion.rating != null ? formatNumber(champion.rating) : "—"}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{champion.ratingDeviation != null ? formatNumber(champion.ratingDeviation) : "—"}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{champion.volatility != null ? formatNumber(champion.volatility, { maximumFractionDigits: 4 }) : "—"}</td>
                  <td className="px-1.5 py-1.5 font-mono text-xs text-pc-text-secondary">{t("common.format.minutesShort", { minutes: formatNumber(champion.minutesPlayed) })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
