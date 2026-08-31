/**
 * Define the player route surface for performance page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPerformanceLeaderboard, fetchPerformanceMetrics, type PerformanceLeaderboardEntry, type PerformanceMetricSummary } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import PlayerName from "@/components/player-name";
import { LoadingPanel } from "@/components/async-state";
import TablePagination, { type TablePageSize } from "@/components/table-pagination";
import { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PerformanceRangeBellCurve from "@/components/performance-range-bell-curve";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";


const METRICS = [
  { key: "gpm", labelKey: "common.metrics.creditsPerMinute", color: "text-yellow-400", role: undefined },
  { key: "hpm", labelKey: "common.metrics.healingPerMinute", color: "text-emerald-400", role: "Support" },
  { key: "dpm", labelKey: "common.metrics.damagePerMinute", color: "text-red-400", role: "Damage" },
  { key: "mpm", labelKey: "common.metrics.shieldingPerMinute", color: "text-blue-400", role: "Frontline" },
] as const satisfies ReadonlyArray<{ key: "gpm" | "hpm" | "dpm" | "mpm"; labelKey: TranslationKey; color: string; role?: "Support" | "Damage" | "Frontline" }>;

type PerformanceScope = "ranked" | "casual";

/**
 * Render the PerformanceLeaderboardPage view for the player performance page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function PerformanceLeaderboardPage() {
  const { t , formatNumber} = useLocalization();
  const [scope, setScope] = useState<PerformanceScope>("ranked");
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("gpm");
  const [result, setResult] = useState<{
    key: string;
    rows: PerformanceLeaderboardEntry[];
    summary: PerformanceMetricSummary | null;
  }>({ key: "", rows: [], summary: null });
  const [page, setPage] = usePersistentDirectoryPage();
  const [pageSize, setPageSize] = useState<TablePageSize>(25);
  const config = METRICS.find((entry) => entry.key === metric)!;
  const requestKey = `${scope}:${metric}:${config.role ?? "Global"}`;
  const loading = result.key !== requestKey;
  const rows = loading ? [] : result.rows;
  const summary = loading ? null : result.summary;

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchPerformanceLeaderboard({
        metric,
        limit: 100,
        scope,
        queueId: scope === "ranked" ? 486 : undefined,
        role: config.role,
      }),
      fetchPerformanceMetrics({
        metric,
        scope,
        queueId: scope === "ranked" ? 486 : undefined,
        role: config.role,
      }),
    ])
      .then(([data, metrics]) => {
        if (!active) return;
        setResult({
          key: requestKey,
          rows: data,
          summary: metrics[metric] ?? null,
        });
      });
    return () => { active = false; };
  }, [config.role, metric, requestKey, scope]);

  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const scopeLabel = t(scope === "ranked" ? "stats.scope.ranked" : "stats.scope.casual");

  return <div className="mx-auto w-full max-w-5xl space-y-5">
    <header>
      <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("menu.performanceLeaderboard")}</h1>
      <p className="mt-1 text-sm text-pc-text-secondary">{t("performance.scopeDescription", { mode: scopeLabel })}</p>
    </header>

    <div className="inline-grid grid-cols-2 rounded-xl border border-pc-border bg-pc-bg-elevated p-1" role="tablist" aria-label={t("performance.modeLabel")}>
      {(["ranked", "casual"] as const).map((value) => <button
        key={value}
        type="button"
        role="tab"
        aria-selected={scope === value}
        onClick={() => { setScope(value); setPage(1); }}
        className={`min-w-28 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${scope === value ? "bg-pc-accent text-pc-bg" : "text-pc-text-secondary hover:bg-pc-bg-secondary hover:text-pc-text"}`}
      >
        {t(value === "ranked" ? "stats.scope.ranked" : "stats.scope.casual")}
      </button>)}
    </div>

    {summary && summary.sampleSize > 0 && <PerformanceRangeBellCurve
      metricLabel={config.role ? t("performance.roleMetric", { role: t(config.role === "Support" ? "common.roles.support" : config.role === "Damage" ? "common.roles.damage" : "common.roles.frontline"), metric: t(config.labelKey) }) : t(config.labelKey)}
      summary={summary}
      formatValue={(value) => formatNumber(Math.round(value))}
      labels={{
        global: t("common.roles.global"),
        range: t("common.metrics.range"),
        mode: t("generated.champions.mode"),
        median: t("performance.median"),
        mean: t("performance.mean"),
        p10: t("generated.champions.p10"),
        p90: t("generated.champions.p90"),
        percentileRange: t("performance.p10p90"),
      }}
    />}

    <div className="grid grid-cols-2 gap-2 rounded-xl border border-pc-border bg-pc-bg-elevated p-1 sm:grid-cols-4">
      {METRICS.map((entry) => <button key={entry.key} type="button" onClick={() => { setMetric(entry.key); setPage(1); }} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:text-sm ${metric === entry.key ? "bg-pc-accent text-pc-bg" : "text-pc-text-secondary hover:bg-pc-bg-secondary hover:text-pc-text"}`}>{t(entry.labelKey)}</button>)}
    </div>

    {loading ? <LoadingPanel /> : <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-pc-border bg-pc-bg-secondary text-left text-xs uppercase text-pc-text-muted">
              <th className="px-4 py-3">#</th>
              <th className="px-3 py-3">{t("generated.players.player")}</th>
              <th className="px-3 py-3">{t("generated.stats.champion")}</th>
              <th className="px-3 py-3">{t("generated.matches.matchId")}</th>
              <th className="px-3 py-3 text-right">{t(config.labelKey)}</th>
              <th className="px-4 py-3">{t("generated.matches.region")}</th>
            </tr>
          </thead>
          <tbody>{visibleRows.map((row) => <tr key={`${row.matchId}-${row.playerId}-${row.rank}`} className="border-b border-pc-border/50 last:border-b-0 hover:bg-pc-bg-secondary/50">
            <td className="px-4 py-3 font-bold text-pc-text-muted">{row.rank}</td>
            <td className="px-3 py-3"><Link href={`/players/${row.playerId}`} className="font-medium text-pc-text hover:text-pc-accent"><PlayerName playerId={row.playerId}>{row.playerName}</PlayerName></Link></td>
            <td className="px-3 py-3">{row.championName ? <span className="inline-flex items-center gap-2 text-pc-text-secondary"><img src={getChampionIconSafe(row.championName)} alt="" className="h-6 w-6 rounded object-contain" />{row.championName}</span> : <span className="text-pc-text-muted">{row.className ?? "—"}</span>}</td>
            <td className="px-3 py-3 font-mono text-pc-text-secondary"><Link href={`/matches/${row.matchId}`} className="hover:text-pc-accent hover:underline">{row.matchId}</Link></td>
            <td className={`px-3 py-3 text-right font-bold tabular-nums ${config.color}`}>{formatNumber(Math.round(row.value))}</td>
            <td className="px-4 py-3 text-pc-text-muted">{row.region ?? "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {rows.length === 0 ? <div className="p-10 text-center text-sm text-pc-text-muted">{t("performance.noData", { mode: scopeLabel })}</div> : <TablePagination page={page} pageSize={pageSize} totalItems={rows.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />}
    </div>}
  </div>;
}
