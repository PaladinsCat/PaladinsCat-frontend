/** ChampionRateDetailPage component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchChampions, type Champion, type PublicStatsScope } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { getStatQuality } from "@/lib/stat-quality";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";
import { getStoredLobbyTierFilter } from "@/lib/lobby-tier";
import type { TranslationKey } from "@/lib/localization/messages";
import { ContentFade, LoadingIndicator } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

type RateMetricKey = "winRate" | "banRate";

interface RateMetricConfig {
  key: RateMetricKey;
  labelKey: TranslationKey;
  stroke: string;
  fill: string;
}

const CLASS_ORDER = ["Frontline", "Damage", "Flank", "Support"] as const;

const STAT_SCOPES = [
  { value: "ranked", labelKey: "stats.scope.ranked" },
  { value: "casual", labelKey: "stats.scope.casual" },
  { value: "team_deathmatch", labelKey: "stats.scope.teamDeathmatch" },
  { value: "arcade", labelKey: "stats.scope.arcade" },
  { value: "wave_defense", labelKey: "stats.scope.waveDefense" },
  { value: "experiment", labelKey: "stats.scope.experiment" },
  { value: "newcomer", labelKey: "stats.scope.newcomer" },
  { value: "bot", labelKey: "stats.scope.bot" },
] as const satisfies ReadonlyArray<{ value: PublicStatsScope; labelKey: TranslationKey }>;

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

type RateChampionRow = {
  id: number;
  name: string;
  className: string;
  value: number;
  matches: number;
  bans: number;
};

type RateClassSection = {
  className: string;
  average: number;
  matches: number;
  bans: number;
  champions: RateChampionRow[];
};

function metricValue(champion: Champion, key: RateMetricKey): number | null {
  const value = key === "winRate" ? champion.winRate : champion.banRate;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function championMatches(champion: Champion): number {
  const value = champion.totalMatches ?? champion.totalPlays ?? 0;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function championBans(champion: Champion): number {
  const value = champion.totalBans ?? 0;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function weightedAverage(rows: RateChampionRow[], key: RateMetricKey): number {
  if (rows.length === 0) return 0;

  // Win rate is per champion appearance, so weighting by match count avoids a
  // low-sample champion pulling a class/global average around. Ban rate in
  // champion_stats_ranked is already a champion's share of total bans, so each
  // champion row should contribute equally when asking "what is typical for
  // this class?".
  if (key === "winRate") {
    const totalMatches = rows.reduce((sum, row) => sum + row.matches, 0);
    if (totalMatches > 0) {
      return rows.reduce((sum, row) => sum + row.value * row.matches, 0) / totalMatches;
    }
  }

  return rows.reduce((sum, row) => sum + row.value, 0) / rows.length;
}

function buildSections(champions: Champion[], key: RateMetricKey): RateClassSection[] {
  return CLASS_ORDER.map((className) => {
    const rows = champions
      .filter((champion) => champion.roles?.includes(className))
      .map((champion): RateChampionRow | null => {
        const value = metricValue(champion, key);
        if (value == null) return null;
        return {
          id: champion.id,
          name: champion.name,
          className,
          value,
          matches: championMatches(champion),
          bans: championBans(champion),
        };
      })
      .filter((row): row is RateChampionRow => row != null)
      .sort((a, b) => b.value - a.value);

    return {
      className,
      average: weightedAverage(rows, key),
      matches: rows.reduce((sum, row) => sum + row.matches, 0),
      bans: rows.reduce((sum, row) => sum + row.bans, 0),
      champions: rows,
    };
  });
}

function pctDiff(value: number, base: number): number {
  return base !== 0 ? ((value - base) / base) * 100 : 0;
}

function metricColor(config: RateMetricConfig, value: number): string {
  return config.key === "winRate" ? getStatQuality(value, 1, 1).color : config.stroke;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function ChampionRateDetailPage({
  config,
  initialChampions = null,
  enableScopeSelection = false,
}: {
  config: RateMetricConfig;
  initialChampions?: Champion[] | null;
  enableScopeSelection?: boolean;
}) {
  const { t, formatNumber, formatPercent: formatRate, formatSignedPercent } = useLocalization();
  const hasInitialChampions = Boolean(initialChampions?.length);
  const [champions, setChampions] = useState<Champion[]>(initialChampions ?? []);
  const [loading, setLoading] = useState(!hasInitialChampions);
  const [hasResolved, setHasResolved] = useState(hasInitialChampions);
  const [loadError, setLoadError] = useState(false);
  const [statsScope, setStatsScope] = useState<PublicStatsScope>("ranked");
  const routeDisplayLoading = useRouteSettledLoading(loading);
  const displayLoading = hasResolved ? false : routeDisplayLoading;

  useEffect(() => {
    if (statsScope === "ranked" && hasInitialChampions && getStoredLobbyTierFilter() === "all") {
      return;
    }

    let cancelled = false;

    fetchChampions({ limit: "200", scope: statsScope })
      .then((rows) => {
        if (!cancelled) setChampions(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setChampions([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setHasResolved(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasInitialChampions, statsScope]);

  const sections = useMemo(() => buildSections(champions, config.key), [champions, config.key]);
  const allRows = useMemo(() => sections.flatMap((section) => section.champions).sort((a, b) => b.value - a.value), [sections]);
  const globalRank = useMemo(() => new Map(allRows.map((row, index) => [row.name, index + 1])), [allRows]);
  const globalAverage = weightedAverage(allRows, config.key);
  const totalMatches = allRows.reduce((sum, row) => sum + row.matches, 0);
  const totalBans = allRows.reduce((sum, row) => sum + row.bans, 0);

  if (displayLoading) return <RouteSkeleton variant="dashboard" />;

  return (
    <ContentFade className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/champions" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("nav.champions")}</Link>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">{t(config.labelKey)}</h1>
        </div>
        {enableScopeSelection && (
          <div className="flex items-center justify-end gap-3">
            {loading && hasResolved && <LoadingIndicator className="gap-2 text-xs text-pc-text-secondary" />}
            <select
              value={statsScope}
              onChange={(event) => {
                const next = event.target.value as PublicStatsScope;
                setLoadError(false);
                if (next === "ranked" && hasInitialChampions && getStoredLobbyTierFilter() === "all") {
                  setChampions(initialChampions ?? []);
                  setLoading(false);
                  setHasResolved(true);
                } else {
                  setLoading(true);
                }
                setStatsScope(next);
              }}
              className="pc-select w-44 shrink-0"
              aria-label={t("stats.scope.label")}
            >
              {STAT_SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{t(scope.labelKey)}</option>)}
            </select>
          </div>
        )}
      </div>
      {loadError && <p role="alert" className="text-sm text-rose-300">{t("async.couldNotLoad")}</p>}

      <div
        aria-busy={loading}
        className={`space-y-6 transition-opacity duration-200 motion-reduce:transition-none ${loading && hasResolved ? "opacity-55" : "opacity-100"}`}
      >
      <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="shrink-0">
              <div className="mb-1 text-xs uppercase tracking-wider text-pc-text-muted">{t("generated.champions.globalAvg")}</div>
              <div className="text-xl font-bold" style={{ color: metricColor(config, globalAverage) }}>{formatRate(globalAverage)}</div>
            </div>
            <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-pc-bg">
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, Math.max(0, globalAverage))}%`, background: config.fill }} />
              <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full" style={{ left: `${Math.min(100, Math.max(0, globalAverage))}%`, background: config.stroke }} />
            </div>
          </div>
          <div className="flex self-end shrink-0 items-center gap-6 text-right sm:self-auto">
            {config.key === "banRate" && (
              <div>
                <div className="mb-1 text-xs uppercase tracking-wider text-pc-text-muted">{t("generated.matches.bans")}</div>
                <div className="text-xl font-bold text-pc-text">{formatNumber(totalBans)}</div>
              </div>
            )}
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-pc-text-muted">{t("generated.champions.trackedMatches")}</div>
              <div className="text-xl font-bold text-pc-text">{formatNumber(totalMatches)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {sections.map((section) => {
          const vsGlobalPct = pctDiff(section.average, globalAverage);

          return (
            <div key={section.className} className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-pc-border p-3">
                  <div className="mr-auto flex min-w-0 items-center gap-2">
                    <img src={CLASS_ICONS[section.className]} alt={section.className} className="w-6 h-6 shrink-0" />
                    <h2 className="text-pc-text font-semibold truncate">{section.className}</h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-pc-text-muted uppercase tracking-wider">{t("generated.champions.classAvg")}</div>
                    <div className="font-bold" style={{ color: metricColor(config, section.average) }}>{formatRate(section.average)}</div>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <div className="text-pc-text-muted uppercase tracking-wider">{t("generated.champions.vsGlobal")}</div>
                    <div className={vsGlobalPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatSignedPercent(vsGlobalPct)}
                    </div>
                  </div>
                  {config.key === "banRate" && (
                    <div className="shrink-0 text-right text-xs">
                      <div className="text-pc-text-muted uppercase tracking-wider">{t("generated.matches.bans")}</div>
                      <div className="text-pc-text-secondary">{formatNumber(section.bans)}</div>
                    </div>
                  )}
                  <div className="shrink-0 text-right text-xs">
                    <div className="text-pc-text-muted uppercase tracking-wider">{t("generated.champions.matches")}</div>
                    <div className="text-pc-text-secondary">{formatNumber(section.matches)}</div>
                  </div>
              </div>

              <div className="divide-y divide-pc-border/50 md:hidden">
                {section.champions.map((champion) => {
                  const rowVsClassPct = pctDiff(champion.value, section.average);
                  const rowVsGlobalPct = pctDiff(champion.value, globalAverage);
                  return <Link key={champion.id} href={`/champions/${championSlug(champion.name)}?scope=${statsScope}`} className="flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-pc-bg/50">
                    <img src={getChampionIconSafe(champion.name)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-pc-text">{champion.name}</div><div className="mt-0.5 flex flex-wrap gap-x-2 text-xs"><span className={rowVsClassPct >= 0 ? "text-emerald-400" : "text-red-400"}>{formatSignedPercent(rowVsClassPct)} {t("generated.champions.class")}</span><span className={rowVsGlobalPct >= 0 ? "text-emerald-400" : "text-red-400"}>{formatSignedPercent(rowVsGlobalPct)} {t("generated.champions.global.9027cc5")}</span><span className="text-pc-text-muted">{formatNumber(champion.matches)} {t("generated.champions.matches.9f3e924")}</span></div></div>
                    <span className="shrink-0 text-right font-mono text-sm font-bold" style={{ color: metricColor(config, champion.value) }}>{formatRate(champion.value)}{config.key === "banRate" && <span className="block text-xs font-normal text-pc-text-muted">{formatNumber(champion.bans)} {t("generated.stats.bans")}</span>}</span>
                  </Link>;
                })}
                {section.champions.length === 0 && <div className="px-3 py-6 text-center text-sm text-pc-text-muted">{t("generated.champions.noChampionData")}</div>}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-pc-text-muted border-b border-pc-border/60">
                      <th className="px-2.5 py-1.5">{t("generated.champions.name")}</th>
                      <th className="w-12 px-2.5 py-1.5">{t("generated.champions.class.41ff354")}</th>
                      <th className="w-12 px-2.5 py-1.5">{t("generated.champions.global")}</th>
                      <th className="px-2.5 py-1.5 text-right">{t(config.labelKey)}</th>
                      <th className="px-2.5 py-1.5 text-right">{t("generated.champions.vsClass")}</th>
                      <th className="px-2.5 py-1.5 text-right">{t("generated.champions.vsGlobal")}</th>
                      <th className="px-2.5 py-1.5 text-right">{t("generated.champions.matches")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.champions.map((champion, index) => {
                      const rowVsClassPct = pctDiff(champion.value, section.average);
                      const rowVsGlobalPct = pctDiff(champion.value, globalAverage);

                      return (
                        <tr key={champion.id} className="border-b border-pc-border/40 hover:bg-pc-bg/50 transition-colors">
                          <td className="px-2.5 py-1.5">
                            <Link href={`/champions/${championSlug(champion.name)}?scope=${statsScope}`} className="flex items-center gap-2 min-w-0 group">
                              <img src={getChampionIconSafe(champion.name)} alt={champion.name} className="h-6 w-6 shrink-0 rounded object-contain" />
                              <span className="text-pc-text font-medium truncate group-hover:text-pc-accent transition-colors">{champion.name}</span>
                            </Link>
                          </td>
                          <td className="px-2.5 py-1.5 text-pc-text-muted">#{index + 1}</td>
                          <td className="px-2.5 py-1.5 text-pc-text-muted">#{globalRank.get(champion.name) ?? "-"}</td>
                          <td className="px-2.5 py-1.5 text-right font-semibold" style={{ color: metricColor(config, champion.value) }}>{formatRate(champion.value)}{config.key === "banRate" && <div className="text-xs font-normal text-pc-text-muted">{formatNumber(champion.bans)} {t("generated.stats.bans")}</div>}</td>
                          <td className="px-2.5 py-1.5 text-right">
                            <span className={rowVsClassPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSignedPercent(rowVsClassPct)}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 text-right">
                            <span className={rowVsGlobalPct >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSignedPercent(rowVsGlobalPct)}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-pc-text-secondary">{formatNumber(champion.matches)}</td>
                        </tr>
                      );
                    })}
                    {section.champions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-pc-text-muted">{t("generated.champions.noChampionData")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
      </div>
    </ContentFade>
  );
}
