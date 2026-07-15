"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, ErrorState, LoadingIndicator, LoadingPanel } from "@/components/async-state";
import { fetchPlayerChampionStats, refreshPlayerChampionStats, type PlayerChampionStat } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championMasteryLevelFromXp } from "@/lib/champion-mastery";
import { formatKda } from "@/lib/kda";
import { useLocalization } from "@/lib/localization-context";
import { formatLocalDateTime } from "@/lib/time-format";

const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

type SortKey = "level" | "matches" | "winRate" | "xp" | "name";

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatCooldown(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export default function PlayerChampionStatsPage() {
  const { t } = useLocalization();
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
      if (sortBy === "name") return direction * a.championName.localeCompare(b.championName);
      const values: Record<Exclude<SortKey, "name">, [number, number]> = {
        level: [championMasteryLevelFromXp(a.xp), championMasteryLevelFromXp(b.xp)],
        matches: [a.matchesPlayed, b.matchesPlayed],
        winRate: [a.winRate ?? -1, b.winRate ?? -1],
        xp: [a.xp, b.xp],
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
        <button type="button" onClick={refresh} disabled={refreshing || refreshRemainingSeconds > 0} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs font-semibold text-pc-text hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-50">{refreshing ? <LoadingIndicator className="gap-2" /> : refreshRemainingSeconds > 0 ? t("generated.players.refreshInValue1", { value1: formatCooldown(refreshRemainingSeconds) }) : t("common.playerChampions.refresh")}</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="pc-select">
          <option value="level">{t("common.playerChampions.sortLevel")}</option>
          <option value="matches">{t("common.playerChampions.sortMatches")}</option>
          <option value="winRate">{t("common.metrics.winRate")}</option>
          <option value="xp">{t("generated.players.championXp")}</option>
          <option value="name">{t("common.playerChampions.sortName")}</option>
        </select>
        <button type="button" onClick={() => setSortDescending((descending) => !descending)} className="pc-select flex cursor-pointer items-center gap-1" title={sortDescending ? t("generated.champions.descending") : t("generated.champions.ascending")}>{sortDescending ? "↓" : "↑"}</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilterRole(null)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${filterRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>{t("generated.champions.all")}</button>
        {ROLES.map((role) => <button key={role.value} type="button" onClick={() => setFilterRole(filterRole === role.value ? null : role.value)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${filterRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
      </div>

      {champions.length === 0 ? <EmptyState title={t("common.playerChampions.empty")} /> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {champions.map((champion) => <ChampionCard key={champion.championId} champion={champion} />)}
        </div>
      )}
    </div>
  );
}

function ChampionCard({ champion }: { champion: PlayerChampionStat }) {
  const { t } = useLocalization();
  const role = ROLES.find((entry) => entry.value === champion.role);
  const masteryLevel = championMasteryLevelFromXp(champion.xp);
  return (
    <article className="group relative rounded-xl border border-pc-border bg-pc-bg-elevated p-3 transition-all duration-200 hover:border-pc-accent-mid hover:shadow-[0_0_20px_rgba(51,182,177,0.08)]">
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-pc-border/50 bg-pc-bg-elevated transition-colors group-hover:border-pc-accent-deep/50"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-full w-full object-contain" /></div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2"><h2 className="truncate text-sm font-semibold text-pc-text transition-colors group-hover:text-pc-accent">{champion.championName}</h2><span className="shrink-0 font-mono text-xs text-pc-accent">{t("common.playerChampions.level", { level: masteryLevel })}</span>{role && <span className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-pc-text-muted pc-surface-subtle"><img src={role.icon} alt="" className="h-3 w-3" />{t(role.labelKey)}</span>}</div>
          <div className="text-xs text-pc-text-muted">{t("generated.players.championXp")} <span className="font-mono text-pc-text-secondary">{formatNumber(champion.xp)}</span></div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-3 border-t border-pc-border/50 pt-2.5 text-center">
        <Metric label={t("common.playerChampions.winsLosses")} value={`${formatNumber(champion.wins)} / ${formatNumber(champion.losses)}`} />
        <Metric label={t("common.playerChampions.kdaShort")} value={t("common.playerChampions.kdaLine", { kills: formatNumber(champion.kills), deaths: formatNumber(champion.deaths), assists: formatNumber(champion.assists) })} />
        <Metric label={t("common.metrics.kda")} value={formatKda(champion.kills, champion.deaths, champion.assists)} />
        <Metric label={t("generated.players.time")} value={`${formatNumber(champion.minutesPlayed)}m`} />
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-pc-border/50 pt-2 text-[10px] text-pc-text-muted">
        <span className="truncate">{t("common.playerChampions.ownership")}: <span className="text-pc-text-secondary">{champion.ownershipType || "—"}</span></span>
        <span className="whitespace-nowrap">{t("common.playerChampions.updated")}: <span className="text-pc-text-secondary">{formatLocalDateTime(champion.lastUpdated)}</span></span>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] uppercase text-pc-text-muted">{label}</div><div className="mt-0.5 truncate font-mono text-xs text-pc-text-secondary">{value}</div></div>;
}
