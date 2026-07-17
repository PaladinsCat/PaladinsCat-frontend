"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { championSlug } from "@/lib/utils";
import { getChampionIconSafe } from "@/lib/champion-icons";
import {
  fetchChampionPerformanceDistributions,
  fetchPerformanceMetricDashboard,
  type ChampionPerformanceDistribution,
  type PerformanceMetricKey,
  type PerformanceMetricSummary,
} from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

/* ── Metric configs ── */

interface MetricConfig {
  key: string;
  labelKey: TranslationKey;
  fullLabelKey: TranslationKey;
  color: string;
  fill: string;
  isDecimal: boolean;
}

const METRIC_CONFIGS: MetricConfig[] = [
  { key: "dpm", labelKey: "common.metrics.dpm", fullLabelKey: "common.metrics.damagePerMinute", color: "#f87171", fill: "rgba(248,113,113,0.15)", isDecimal: false },
  { key: "hpm", labelKey: "common.metrics.hpm", fullLabelKey: "common.metrics.healingPerMinute", color: "#34d399", fill: "rgba(52,211,153,0.15)", isDecimal: false },
  { key: "gpm", labelKey: "common.metrics.cpm", fullLabelKey: "common.metrics.creditsPerMinute", color: "#facc15", fill: "rgba(250,204,21,0.15)", isDecimal: false },
  { key: "mpm", labelKey: "common.metrics.spm", fullLabelKey: "common.metrics.shieldingPerMinute", color: "#60a5fa", fill: "rgba(96,165,250,0.15)", isDecimal: false },
  { key: "kda", labelKey: "common.metrics.kda", fullLabelKey: "common.metrics.kdaRatio", color: "#33b6b1", fill: "rgba(51,182,177,0.15)", isDecimal: true },
];

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};
const CLASS_ORDER = ["Frontline", "Damage", "Flank", "Support"] as const;
const VALID_METRIC_KEYS = new Set<PerformanceMetricKey>(["dpm", "hpm", "gpm", "mpm", "kda"]);

/* ── Types ── */

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
    min: 0, max: 0, mean: 0, median: 0, mode: 0,
    p10: 0, p25: 0, p75: 0, p90: 0, sampleSize: 0,
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

function buildClassData(
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
      : emptySummary();

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

/* ── Tab bar component ── */

function TabBar({
  configs,
  activeKey,
  onChange,
}: {
  configs: MetricConfig[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  const { t } = useLocalization();
  return (
    <div className="grid grid-cols-5 gap-1 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated p-1">
      {configs.map((cfg) => (
        <button
          key={cfg.key}
          onClick={() => onChange(cfg.key)}
          className={`pc-touch-target min-w-0 rounded-lg px-1 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
            activeKey === cfg.key
              ? "text-white shadow-sm"
              : "text-pc-text-secondary hover:text-pc-text"
          }`}
          style={activeKey === cfg.key ? { background: cfg.color } : {}}
        >
          {t(cfg.labelKey)}
        </button>
      ))}
    </div>
  );
}

/* ── Metric panel (same as MetricDetailPage content) ── */

function MetricPanel({ config }: { config: MetricConfig }) {
  const { t , formatNumber, formatPercent} = useLocalization();
  const [metricSummary, setMetricSummary] = useState<PerformanceMetricSummary>(() => emptySummary());
  const [classData, setClassData] = useState<ClassMetricData[]>(() => buildClassData([], {}));

  useEffect(() => {
    const metric = config.key as PerformanceMetricKey;
    if (!VALID_METRIC_KEYS.has(metric)) {
      setMetricSummary(emptySummary());
      setClassData(buildClassData([], {}));
      return;
    }

    let cancelled = false;

    async function load() {
      const [dashboard, championRows] = await Promise.all([
        fetchPerformanceMetricDashboard(metric),
        fetchChampionPerformanceDistributions({ metric }),
      ]);

      if (cancelled) return;

      const classSummaries = dashboard.roles as Partial<Record<(typeof CLASS_ORDER)[number], PerformanceMetricSummary>>;

      setMetricSummary(normalizeSummary(dashboard.summary));
      setClassData(buildClassData(championRows, classSummaries));
    }

    load().catch(() => {
      if (!cancelled) {
        setMetricSummary(emptySummary());
        setClassData(buildClassData([], {}));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [config.key]);

  const formatVal = (value: number) => config.isDecimal ? formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : formatNumber(Math.round(value));
  const formatSigned = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${config.isDecimal ? formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : formatNumber(Math.round(value))}`;
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
    <div className="space-y-6">
      {/* Global summary card */}
      <section className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {[
            { label: t("generated.stats.globalAvg"), value: formatVal(metricSummary.mean), accent: true },
            { label: t("generated.stats.p10"), value: formatVal(metricSummary.p10) },
            { label: t("generated.stats.p90"), value: formatVal(metricSummary.p90) },
            { label: t("generated.stats.max"), value: formatVal(metricSummary.max) },
            { label: t("generated.stats.samples"), value: formatNumber(metricSummary.sampleSize) },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <div className="text-pc-text-muted text-xs uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-xl font-bold truncate" style={{ color: item.accent ? config.color : undefined }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 relative h-2 rounded-full bg-pc-bg overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${globalMeanPct}%`, background: config.fill }} />
          <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full" style={{ left: `${globalMeanPct}%`, background: config.color }} />
        </div>
      </section>

      {/* Class tables */}
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
                    <div className="text-xs text-pc-text-muted uppercase tracking-wider">{t("generated.stats.classAvg")}</div>
                    <div className="text-lg font-bold" style={{ color: config.color }}>{formatVal(classMean)}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <div className="text-pc-text-muted text-xs uppercase tracking-wider">{t("generated.stats.vsGlobal")}</div>
                    <div className={classVsGlobal >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatSigned(classVsGlobal)} ({classVsGlobalPct >= 0 ? "+" : ""}{formatPercent(classVsGlobalPct)})
                    </div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-xs uppercase tracking-wider">{t("generated.stats.p10")}</div>
                    <div className="text-pc-text-secondary">{formatVal(section.summary.p10)}</div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-xs uppercase tracking-wider">{t("generated.stats.p90")}</div>
                    <div className="text-pc-text-secondary">{formatVal(section.summary.p90)}</div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-xs uppercase tracking-wider">{t("generated.stats.samples")}</div>
                    <div className="text-pc-text-secondary">{formatNumber(section.summary.sampleSize)}</div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-pc-border/50 sm:hidden">
                {section.champions.map((champion, index) => {
                  const vsClassPct = pctDiff(champion.value, classMean);
                  const vsGlobalPct = pctDiff(champion.value, globalMean);
                  return (
                    <Link key={champion.name} href={`/champions/${championSlug(champion.name)}`} className="flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-pc-bg/50">
                      <div className="w-7 shrink-0 text-center text-xs text-pc-text-muted">#{index + 1}</div>
                      <img src={getChampionIconSafe(champion.name)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-pc-text">{champion.name}</div>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px]">
                          <span className={vsClassPct >= 0 ? "text-emerald-400" : "text-red-400"}>{vsClassPct >= 0 ? "+" : ""}{formatNumber(vsClassPct, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{t("generated.stats.class")}</span>
                          <span className={vsGlobalPct >= 0 ? "text-emerald-400" : "text-red-400"}>{vsGlobalPct >= 0 ? "+" : ""}{formatNumber(vsGlobalPct, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{t("generated.stats.global.ac9baca")}</span>
                          <span className="text-pc-text-muted">{formatNumber(champion.matches)} {t("generated.stats.matches.9f3e924")}</span>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold" style={{ color: config.color }}>{formatVal(champion.value)}</span>
                    </Link>
                  );
                })}
                {section.champions.length === 0 && <div className="px-3 py-6 text-center text-sm text-pc-text-muted">{t("generated.stats.noChampionData")}</div>}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-pc-text-muted border-b border-pc-border/60">
                      <th className="px-3 py-2 w-12">{t("generated.stats.class.41ff354")}</th>
                      <th className="px-3 py-2 w-12">{t("generated.stats.global")}</th>
                      <th className="px-3 py-2">{t("generated.stats.name")}</th>
                      <th className="px-3 py-2 text-right">{t(config.fullLabelKey)}</th>
                      <th className="px-3 py-2 text-right">{t("generated.stats.vsClass")}</th>
                      <th className="px-3 py-2 text-right">{t("generated.stats.vsGlobal")}</th>
                      <th className="px-3 py-2 text-right">{t("generated.stats.matches")}</th>
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
                          <td className="px-3 py-2 text-right font-semibold" style={{ color: config.color }}>{formatVal(champion.value)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={vsClass >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSigned(vsClass)} ({vsClassPct >= 0 ? "+" : ""}{formatPercent(vsClassPct)})
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={vsGlobal >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSigned(vsGlobal)} ({vsGlobalPct >= 0 ? "+" : ""}{formatPercent(vsGlobalPct)})
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-pc-text-secondary">{formatNumber(champion.matches)}</td>
                        </tr>
                      );
                    })}
                    {section.champions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-pc-text-muted">
                          {t("generated.stats.noChampionData")}</td>
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

/* ── Client page wrapper (reads search params) ── */

function MetricsPageClient() {
  const { t } = useLocalization();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "dpm";

  const activeConfig = useMemo(
    () => METRIC_CONFIGS.find((c) => c.key === tab) || METRIC_CONFIGS[0],
    [tab],
  );

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", key);
    router.replace(`/stats/metrics?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/stats" className="text-pc-accent text-xs hover:underline mb-2 inline-block">
          {t("generated.stats.backToGlobalStats")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.stats.performanceMetrics")}</h1>
        <p className="text-pc-text-muted text-sm mt-1">{t("generated.stats.compareChampionPerformanceAcrossAllMetrics")}</p>
      </div>

      <TabBar configs={METRIC_CONFIGS} activeKey={activeConfig.key} onChange={handleTabChange} />

      <MetricPanel config={activeConfig} />
    </div>
  );
}

export default function MetricsPage() {
  return (
    <Suspense fallback={<LoadingPanel />}>
      <MetricsPageClient />
    </Suspense>
  );
}
