"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, ErrorState, LoadingIndicator, LoadingPanel } from "@/components/async-state";
import { fetchPlayerChampionStats, refreshPlayerChampionStats, type PlayerChampionStat } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championMasteryLevelFromXp } from "@/lib/champion-mastery";
import { calculateKda, formatKda } from "@/lib/kda";
import { useLocalization } from "@/lib/localization-context";
import { formatLocalDateTime } from "@/lib/time-format";


const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

type SortKey = "level" | "kda" | "winRate" | "playTime";

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
    const updateRemaining = () => setRefreshRemainingSeconds(Math.max(0, Math.ceil((lastUpdated + 10 * 60 * 1000 - Date.now()) / 1000)));
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
      };
      const [left, right] = values[sortBy];
      return direction * (left - right)
        || (sortBy === "level" ? direction * (a.xp - b.xp) : 0)
        || a.championName.localeCompare(b.championName);
    }), [filterRole, sortBy, sortDescending, stats]);

  if (!stats && !error) return <LoadingPanel />;
  if (error && !stats) return <ErrorState title={t("generated.players.championUnavailable")} message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/players/${playerId}`} className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.playerProfile")}</Link>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("common.playerChampions.title")}</h1>
          <p className="mt-1 text-sm text-pc-text-secondary">{t("common.playerChampions.allChampions", { count: stats?.length ?? 0 })}</p>
        </div>
        <button type="button" onClick={refresh} disabled={refreshing || refreshRemainingSeconds > 0} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs font-semibold text-pc-text hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-50">{refreshing ? <LoadingIndicator className="gap-2" /> : refreshRemainingSeconds > 0 ? t("generated.players.refreshInValue1", { value1: formatDuration(refreshRemainingSeconds) }) : t("common.playerChampions.refresh")}</button>
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
          </select>
          <button type="button" onClick={() => setSortDescending((descending) => !descending)} className="pc-select flex cursor-pointer items-center gap-1" title={sortDescending ? t("generated.champions.descending") : t("generated.champions.ascending")}>{sortDescending ? "↓" : "↑"}</button>
        </div>
      </div>

      {champions.length === 0 ? <EmptyState title={t("common.playerChampions.empty")} /> : (
        <div className="mx-auto w-fit overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated">
          <table className="w-fit min-w-[480px] text-sm">
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
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-accent">{championMasteryLevelFromXp(champion.xp)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-text-secondary">{formatNumber(champion.xp)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-text-secondary">{formatNumber(champion.kills)}/{formatNumber(champion.deaths)}/{formatNumber(champion.assists)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-text-secondary">{formatKda(champion.kills, champion.deaths, champion.assists)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-text-secondary">{formatNumber(champion.wins)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-text-secondary">{formatNumber(champion.losses)}</td>
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-text-secondary">{champion.winRate != null ? t("common.playerChampions.winPercentage", { value: formatNumber(champion.winRate) }) : "—"}</td>
                  <td className="px-1.5 py-1.5 font-mono text-[11px] text-pc-text-secondary">{t("common.format.minutesShort", { minutes: formatNumber(champion.minutesPlayed) })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
