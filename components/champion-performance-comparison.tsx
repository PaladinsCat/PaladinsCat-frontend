/** All champion averages in one ranked comparison; independent of the overview metric.
 * refs: endpoints: GET /stats/performance-metrics/by-champion · migrations: 169
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";
import { fetchChampionPerformanceDistributions, fetchChampions } from "@/lib/api-client";
import { getPercentageColor } from "@/lib/stat-quality";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { GAME_PERFORMANCE_METRICS } from "@/lib/performance-selection";
import { useLocalization } from "@/lib/localization-context";
import { ErrorState, LoadingIndicator } from "@/components/async-state";
import { SegmentedControl } from "@/components/ui/segmented-control";

const LABELS = { winRate: "common.sort.winRate", banRate: "common.metrics.banRate", dpm: "common.metrics.dpm", hpm: "common.metrics.hpm", gpm: "common.metrics.cpm", mpm: "common.metrics.spm", kda: "common.metrics.kda", kpm: "common.metrics.kpm", deaths_per_minute: "common.metrics.deathsPerMinute" } as const;
const COLUMNS = ["winRate", "banRate", ...GAME_PERFORMANCE_METRICS] as const;
type ComparisonMetric = (typeof COLUMNS)[number];
const CLASSES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "Class_Front_Line_Icon" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "Class_Damage_Icon" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "Class_Flank_Icon" },
  { value: "Support", labelKey: "common.roles.support", icon: "Class_Support_Icon" },
] as const;
type ChampionClass = "all" | (typeof CLASSES)[number]["value"];
type ChampionMeasures = Partial<Record<ComparisonMetric, number>> & { matches?: number; bans?: number };
type Averages = Map<number, ChampionMeasures>;
type SortKey = "name" | ComparisonMetric;

/**
 * Render champion performance comparison with `ErrorState`, `SegmentedControl`, `LoadingIndicator`.
 * I/O types: `none -> JSX.Element`.
 * refs: none
 */
export default function ChampionPerformanceComparison() {
  const { t, formatNumber, formatPercent, locale } = useLocalization();
  const [averages, setAverages] = useState<Averages | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [championClass, setChampionClass] = useState<ChampionClass>("all");
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({ key: "name", ascending: true });
  useEffect(() => {
    let active = true;
    Promise.all([
      fetchChampions({ scope: "ranked" }),
      Promise.all(GAME_PERFORMANCE_METRICS.map(async metric => ({ metric, rows: await fetchChampionPerformanceDistributions({ metric, queueId: 486 }) }))),
    ]).then(([champions, results]) => {
      const next: Averages = new Map();
      for (const champion of champions) {
        const rates: ChampionMeasures = {};
        const matches = champion.totalMatches ?? champion.totalPlays;
        if (matches != null && Number.isFinite(matches)) rates.matches = matches;
        if (champion.totalBans != null && Number.isFinite(champion.totalBans)) rates.bans = champion.totalBans;
        for (const key of ["winRate", "banRate"] as const) {
          const value = champion[key];
          if (value != null && Number.isFinite(value)) rates[key] = value;
        }
        next.set(champion.id, rates);
      }
      for (const { metric, rows } of results) for (const row of rows) {
        if (!row.totalMatches || !Number.isFinite(row.mean)) continue;
        const champion = next.get(row.championId) ?? {};
        champion[metric] = row.mean;
        next.set(row.championId, champion);
      }
      if (active) setAverages(next);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);

  const rows = STATIC_CHAMPIONS.filter(champion => championClass === "all" || champion.roles.includes(championClass)).sort((a, b) => {
    const byName = a.name.localeCompare(b.name, locale);
    if (sort.key === "name") return sort.ascending ? byName : -byName;
    const left = averages?.get(a.id)?.[sort.key];
    const right = averages?.get(b.id)?.[sort.key];
    if (left == null) return right == null ? byName : 1;
    if (right == null) return -1;
    return (sort.ascending ? left - right : right - left) || byName;
  });
  const sortHeading = (key: SortKey, label: string) => <th key={key} scope="col" aria-sort={sort.key === key ? sort.ascending ? "ascending" : "descending" : "none"} className={`px-4 py-3 ${key === "name" ? "text-left sm:pl-6" : "text-right"}`}>
    <button type="button" className="inline-flex items-center gap-2 font-medium text-pc-text-secondary hover:text-pc-text" onClick={() => setSort(current => ({ key, ascending: current.key === key ? !current.ascending : key === "name" }))}>
      {label}{sort.key === key ? sort.ascending ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" /> : <ArrowUpDown className="h-3 w-3" aria-hidden="true" />}
    </button>
  </th>;

  if (failed) return <ErrorState title={t("stats.performance.championTitle")} message={t("stats.performance.unavailable")} onRetry={() => { setFailed(false); setAttempt(value => value + 1); }} />;
  return <section className="pc-card-flush min-w-0" aria-labelledby="champion-averages" aria-busy={!averages}>
    <header className="space-y-2 p-4 sm:p-6">
      <h2 id="champion-averages" className="pc-heading scroll-mt-24 text-xl">{t("stats.performance.championTitle")}</h2>
      <p className="text-sm text-pc-text-secondary">{t("stats.performance.championDescription", { count: rows.length })}</p>
      <div className="pt-2">
        <span className="pc-label">{t("generated.players.class")}</span>
        <SegmentedControl<ChampionClass> label={t("generated.players.class")} value={championClass} onChange={setChampionClass} items={[
          { value: "all", label: t("generated.players.all") },
          ...CLASSES.map(role => ({ value: role.value, label: t(role.labelKey), icon: <img src={`/images/icons/${role.icon}.avif`} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" /> })),
        ]} />
      </div>
    </header>
    {!averages && <div className="px-4 pb-4 sm:px-6"><LoadingIndicator /></div>}
    <div className="overflow-x-auto" role="region" aria-label={t("stats.performance.championTitle")} tabIndex={0}>
      <table className="w-full text-sm">
        <caption className="sr-only">{t("stats.performance.championDescription", { count: rows.length })}</caption>
        <thead><tr className="border-b border-pc-border text-xs">
          {sortHeading("name", t("stats.performance.champion"))}
          {COLUMNS.map(metric => sortHeading(metric, t(LABELS[metric])))}
        </tr></thead>
        <tbody>{rows.map(champion => <tr key={champion.id} className="border-b border-pc-border last:border-0">
          <th scope="row" className="px-4 py-3 text-left font-medium sm:pl-6">
            <Link href={`/champions/${championSlug(champion.name)}`} className="flex min-w-36 items-center gap-3 text-pc-text hover:text-pc-accent">
              <img src={getChampionIconSafe(champion.name)} alt="" width={32} height={32} loading="lazy" className="h-8 w-8 shrink-0 rounded-md object-cover" />
              <span>{champion.name}</span>
            </Link>
          </th>
          {COLUMNS.map(metric => {
            const value = averages?.get(champion.id)?.[metric];
            const percentage = metric === "winRate" || metric === "banRate";
            const count = averages?.get(champion.id)?.[metric === "winRate" ? "matches" : "bans"];
            const countDescription = count == null ? t("stats.performance.countUnavailable") : t(metric === "winRate" ? "stats.performance.winCountHelp" : "stats.performance.banCountHelp", { count: formatNumber(count), champion: champion.name });
            return <td key={metric} className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-pc-text" style={percentage && value != null ? { color: getPercentageColor(value) } : undefined}>
              {averages ? percentage ? <Tooltip.Root>
                <Tooltip.Trigger type="button" delay={0} aria-label={countDescription} aria-describedby={`rate-count-${champion.id}-${metric}`} className="ml-auto flex cursor-help flex-col items-end gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
                  <span>{formatPercent(value, { maximumFractionDigits: 2 })}</span>
                  <span className="text-xs text-pc-text-secondary">{formatNumber(count)}</span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner sideOffset={8} className="z-50">
                    <Tooltip.Popup id={`rate-count-${champion.id}-${metric}`} role="tooltip" className="pc-surface max-w-72 rounded-lg border border-pc-border px-3 py-2 text-xs leading-5 text-pc-text shadow-lg">{countDescription}</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root> : formatNumber(value, { maximumFractionDigits: metric === "kda" || metric === "kpm" || metric === "deaths_per_minute" ? 2 : 0 }) : <span className="pc-skeleton ml-auto block h-4 w-12 rounded" />}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
    <p className="p-4 text-xs text-pc-text-secondary sm:p-6">{t("stats.performance.championNote")}</p>
  </section>;
}
