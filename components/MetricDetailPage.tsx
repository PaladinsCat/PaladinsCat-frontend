"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MOCK_GLOBAL_METRICS, MOCK_METRIC_BY_CLASS } from "@/lib/mock-data";
import { championSlug } from "@/lib/utils";
import { getChampionIconSafe } from "@/lib/champion-icons";
import {
  fetchChampionPerformanceDistributions,
  fetchPerformanceMetrics,
  type ChampionPerformanceDistribution,
  type PerformanceMetricKey,
  type PerformanceMetricSummary,
} from "@/lib/api-client";

interface MetricConfig {
  key: string;
  label: string;
  unit: string;
  stroke: string;
  fill: string;
}

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const CLASS_ORDER = ["Frontline", "Damage", "Flank", "Support"] as const;
const VALID_METRIC_KEYS = new Set<PerformanceMetricKey>(["dpm", "hpm", "gpm", "mpm", "kda"]);

type ChampionMetricRow = {
  name: string;
  value: number;
  matches: number;
  min: number;
  max: number;
  median: number;
  mode: number;
  className: string;
};

type ClassMetricData = {
  className: string;
  summary: PerformanceMetricSummary;
  champions: ChampionMetricRow[];
};

function emptySummary(): PerformanceMetricSummary {
  return {
    min: 0,
    max: 0,
    mean: 0,
    median: 0,
    mode: 0,
    p10: 0,
    p25: 0,
    p75: 0,
    p90: 0,
    sampleSize: 0,
  };
}

function normalizeSummary(summary?: Partial<PerformanceMetricSummary>): PerformanceMetricSummary {
  const fallback = emptySummary();
  return {
    min: Number(summary?.min ?? fallback.min),
    max: Number(summary?.max ?? fallback.max),
    mean: Number(summary?.mean ?? fallback.mean),
    median: Number(summary?.median ?? summary?.mean ?? fallback.median),
    mode: Number(summary?.mode ?? summary?.mean ?? fallback.mode),
    p10: Number(summary?.p10 ?? fallback.p10),
    p25: Number(summary?.p25 ?? fallback.p25),
    p75: Number(summary?.p75 ?? fallback.p75),
    p90: Number(summary?.p90 ?? fallback.p90),
    sampleSize: Number(summary?.sampleSize ?? fallback.sampleSize),
  };
}

function mockClassSummary(metric: string, className: string): PerformanceMetricSummary {
  const mock = (MOCK_METRIC_BY_CLASS[metric] || {})[className];
  return normalizeSummary({
    min: mock?.min,
    max: mock?.max,
    mean: mock?.avg,
    median: mock?.avg,
    mode: mock?.avg,
    p10: mock?.min,
    p90: mock?.max,
    sampleSize: mock?.champions?.reduce((sum: number, row: { matches?: number }) => sum + (row.matches || 0), 0) || 0,
  });
}

function buildClassData(
  metric: string,
  rows: ChampionPerformanceDistribution[],
  classSummaries: Partial<Record<(typeof CLASS_ORDER)[number], PerformanceMetricSummary>>,
): ClassMetricData[] {
  const grouped: Record<string, ChampionMetricRow[]> = {};

  for (const row of rows) {
    const className = row.className || "Unknown";
    grouped[className] = grouped[className] || [];
    grouped[className].push({
      name: row.championName,
      value: row.avgValue,
      matches: row.totalMatches,
      min: row.min,
      max: row.max,
      median: row.median,
      mode: row.mode,
      className,
    });
  }

  return CLASS_ORDER.map((className) => {
    const champions = [...(grouped[className] || [])].sort((a, b) => b.value - a.value);
    const derivedSummary = champions.length > 0
      ? normalizeSummary({
          min: Math.min(...champions.map((row) => row.min)),
          max: Math.max(...champions.map((row) => row.max)),
          mean: champions.reduce((sum, row) => sum + row.value * row.matches, 0) / Math.max(champions.reduce((sum, row) => sum + row.matches, 0), 1),
          median: champions.reduce((sum, row) => sum + row.median * row.matches, 0) / Math.max(champions.reduce((sum, row) => sum + row.matches, 0), 1),
          mode: champions.reduce((sum, row) => sum + row.mode * row.matches, 0) / Math.max(champions.reduce((sum, row) => sum + row.matches, 0), 1),
          sampleSize: champions.reduce((sum, row) => sum + row.matches, 0),
        })
      : mockClassSummary(metric, className);

    return {
      className,
      summary: normalizeSummary(classSummaries[className] || derivedSummary),
      champions,
    };
  });
}

function pctDiff(value: number, base: number): number {
  return base !== 0 ? ((value - base) / base) * 100 : 0;
}

export default function MetricDetailPage({ config }: { config: MetricConfig }) {
  const [metricSummary, setMetricSummary] = useState<PerformanceMetricSummary>(() =>
    normalizeSummary(MOCK_GLOBAL_METRICS[config.key as keyof typeof MOCK_GLOBAL_METRICS] as Partial<PerformanceMetricSummary>)
  );
  const [classData, setClassData] = useState<ClassMetricData[]>(() => buildClassData(config.key, [], {}));

  useEffect(() => {
    const metric = config.key as PerformanceMetricKey;
    if (!VALID_METRIC_KEYS.has(metric)) {
      setMetricSummary(normalizeSummary(MOCK_GLOBAL_METRICS[config.key as keyof typeof MOCK_GLOBAL_METRICS] as Partial<PerformanceMetricSummary>));
      setClassData(buildClassData(config.key, [], {}));
      return;
    }

    let cancelled = false;

    async function load() {
      const [summaries, championRows, ...classSummaryRows] = await Promise.all([
        fetchPerformanceMetrics({ metric }),
        fetchChampionPerformanceDistributions({ metric }),
        ...CLASS_ORDER.map((role) => fetchPerformanceMetrics({ metric, role }).catch(() => ({}))),
      ]);

      if (cancelled) return;

      const classSummaries = Object.fromEntries(
        CLASS_ORDER.map((role, index) => [role, (classSummaryRows[index] as Record<string, PerformanceMetricSummary>)[metric]])
      ) as Partial<Record<(typeof CLASS_ORDER)[number], PerformanceMetricSummary>>;

      setMetricSummary(normalizeSummary(summaries[metric]));
      setClassData(buildClassData(config.key, championRows, classSummaries));
    }

    load().catch(() => {
      if (!cancelled) {
        setMetricSummary(normalizeSummary(MOCK_GLOBAL_METRICS[config.key as keyof typeof MOCK_GLOBAL_METRICS] as Partial<PerformanceMetricSummary>));
        setClassData(buildClassData(config.key, [], {}));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [config.key]);

  const isDecimal = config.key === "kda";
  const formatVal = (value: number) => isDecimal ? value.toFixed(1) : Math.round(value).toLocaleString();
  const formatSigned = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${isDecimal ? value.toFixed(1) : Math.round(value).toLocaleString()}`;
  };

  const globalRank = useMemo(() => {
    const ranked = classData
      .flatMap((section) => section.champions)
      .sort((a, b) => b.value - a.value);
    return new Map(ranked.map((row, index) => [row.name, index + 1]));
  }, [classData]);

  const globalMean = metricSummary.mean;
  const globalRange = metricSummary.max - metricSummary.min || 1;
  const globalMeanPct = Math.max(0, Math.min(100, ((globalMean - metricSummary.min) / globalRange) * 100));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/stats" className="text-pc-accent text-xs hover:underline mb-2 inline-block">Back to Global Stats</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{config.label}</h1>
      </div>

      <section className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Global Avg", value: formatVal(metricSummary.mean), accent: true },
            { label: "P10", value: formatVal(metricSummary.p10) },
            { label: "P90", value: formatVal(metricSummary.p90) },
            { label: "Max", value: formatVal(metricSummary.max) },
            { label: "Samples", value: metricSummary.sampleSize.toLocaleString() },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <div className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-xl font-bold truncate" style={{ color: item.accent ? config.stroke : undefined }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 relative h-2 rounded-full bg-pc-bg overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${globalMeanPct}%`, background: config.fill }} />
          <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full" style={{ left: `${globalMeanPct}%`, background: config.stroke }} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {classData.map((section) => {
          const classMean = section.summary.mean;
          const classVsGlobal = classMean - globalMean;
          const classVsGlobalPct = pctDiff(classMean, globalMean);

          return (
            <div key={section.className} className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-pc-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={CLASS_ICONS[section.className]} alt={section.className} className="w-6 h-6 shrink-0" />
                    <h2 className="text-pc-text font-semibold truncate">{section.className}</h2>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-pc-text-muted uppercase tracking-wider">Class Avg</div>
                    <div className="text-lg font-bold" style={{ color: config.stroke }}>{formatVal(classMean)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4 text-xs">
                  <div>
                    <div className="text-pc-text-muted text-[10px] uppercase tracking-wider">vs Global</div>
                    <div className={classVsGlobal >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatSigned(classVsGlobal)} ({classVsGlobalPct >= 0 ? "+" : ""}{classVsGlobalPct.toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-[10px] uppercase tracking-wider">P10</div>
                    <div className="text-pc-text-secondary">{formatVal(section.summary.p10)}</div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-[10px] uppercase tracking-wider">P90</div>
                    <div className="text-pc-text-secondary">{formatVal(section.summary.p90)}</div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-[10px] uppercase tracking-wider">Samples</div>
                    <div className="text-pc-text-secondary">{section.summary.sampleSize.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-pc-text-muted border-b border-pc-border/60">
                      <th className="px-3 py-2 w-12">Class</th>
                      <th className="px-3 py-2 w-12">Global</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2 text-right">{config.label}</th>
                      <th className="px-3 py-2 text-right">vs Class</th>
                      <th className="px-3 py-2 text-right">vs Global</th>
                      <th className="px-3 py-2 text-right">Matches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.champions.map((champion, index) => {
                      const vsClass = champion.value - classMean;
                      const vsGlobal = champion.value - globalMean;
                      const vsClassPct = pctDiff(champion.value, classMean);
                      const vsGlobalPct = pctDiff(champion.value, globalMean);

                      return (
                        <tr key={champion.name} className="border-b border-pc-border/40 hover:bg-pc-bg/50 transition-colors">
                          <td className="px-3 py-2 text-pc-text-muted">#{index + 1}</td>
                          <td className="px-3 py-2 text-pc-text-muted">#{globalRank.get(champion.name) ?? "-"}</td>
                          <td className="px-3 py-2">
                            <Link href={`/champions/${championSlug(champion.name)}`} className="flex items-center gap-2 min-w-0 group">
                              <img src={getChampionIconSafe(champion.name)} alt={champion.name} className="w-7 h-7 rounded object-contain shrink-0" />
                              <span className="text-pc-text font-medium truncate group-hover:text-pc-accent transition-colors">{champion.name}</span>
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold" style={{ color: config.stroke }}>{formatVal(champion.value)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={vsClass >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSigned(vsClass)} ({vsClassPct >= 0 ? "+" : ""}{vsClassPct.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={vsGlobal >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSigned(vsGlobal)} ({vsGlobalPct >= 0 ? "+" : ""}{vsGlobalPct.toFixed(1)}%)
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-pc-text-secondary">{champion.matches.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {section.champions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-pc-text-muted">
                          No champion data
                        </td>
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
  );
}
