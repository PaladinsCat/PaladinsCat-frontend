"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchChampions, type Champion } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";

type RateMetricKey = "winRate" | "banRate";

interface RateMetricConfig {
  key: RateMetricKey;
  label: string;
  stroke: string;
  fill: string;
}

const CLASS_ORDER = ["Frontline", "Damage", "Flank", "Support"] as const;

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
};

type RateClassSection = {
  className: string;
  average: number;
  matches: number;
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
        };
      })
      .filter((row): row is RateChampionRow => row != null)
      .sort((a, b) => b.value - a.value);

    return {
      className,
      average: weightedAverage(rows, key),
      matches: rows.reduce((sum, row) => sum + row.matches, 0),
      champions: rows,
    };
  });
}

function pctDiff(value: number, base: number): number {
  return base !== 0 ? ((value - base) / base) * 100 : 0;
}

function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatSigned(value: number): string {
  const normalized = Math.abs(value) < 0.05 ? 0 : value;
  return `${normalized >= 0 ? "+" : ""}${normalized.toFixed(1)}%`;
}

function formatSignedDeltaPercent(value: number): string {
  const normalized = Math.abs(value) < 0.05 ? 0 : value;
  return `${normalized >= 0 ? "+" : ""}${normalized.toFixed(1)}%`;
}

export default function ChampionRateDetailPage({ config }: { config: RateMetricConfig }) {
  const [champions, setChampions] = useState<Champion[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchChampions({ limit: "200" })
      .then((rows) => {
        if (!cancelled) setChampions(rows);
      })
      .catch(() => {
        if (!cancelled) setChampions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(() => buildSections(champions, config.key), [champions, config.key]);
  const allRows = useMemo(() => sections.flatMap((section) => section.champions).sort((a, b) => b.value - a.value), [sections]);
  const globalRank = useMemo(() => new Map(allRows.map((row, index) => [row.name, index + 1])), [allRows]);
  const globalAverage = weightedAverage(allRows, config.key);
  const totalMatches = allRows.reduce((sum, row) => sum + row.matches, 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/stats" className="text-pc-accent text-xs hover:underline mb-2 inline-block">Back to Global Stats</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{config.label}</h1>
      </div>

      <section className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Global Avg", value: formatRate(globalAverage), accent: true },
            { label: "Champions", value: allRows.length.toLocaleString() },
            { label: "Tracked Matches", value: totalMatches.toLocaleString() },
            { label: "Top Value", value: allRows[0] ? formatRate(allRows[0].value) : "--" },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <div className="text-pc-text-muted text-xs uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-xl font-bold truncate" style={{ color: item.accent ? config.stroke : undefined }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 relative h-2 rounded-full bg-pc-bg overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, Math.max(0, globalAverage))}%`, background: config.fill }} />
          <div className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full" style={{ left: `${Math.min(100, Math.max(0, globalAverage))}%`, background: config.stroke }} />
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {sections.map((section) => {
          const vsGlobal = section.average - globalAverage;
          const vsGlobalPct = pctDiff(section.average, globalAverage);

          return (
            <div key={section.className} className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-pc-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={CLASS_ICONS[section.className]} alt={section.className} className="w-6 h-6 shrink-0" />
                    <h2 className="text-pc-text font-semibold truncate">{section.className}</h2>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-pc-text-muted uppercase tracking-wider">Class Avg</div>
                    <div className="text-lg font-bold" style={{ color: config.stroke }}>{formatRate(section.average)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                  <div>
                    <div className="text-pc-text-muted text-xs uppercase tracking-wider">vs Global</div>
                    <div className={vsGlobal >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatSigned(vsGlobal)} ({formatSignedDeltaPercent(vsGlobalPct)})
                    </div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-xs uppercase tracking-wider">Champions</div>
                    <div className="text-pc-text-secondary">{section.champions.length.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-xs uppercase tracking-wider">Matches</div>
                    <div className="text-pc-text-secondary">{section.matches.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-pc-border/50 sm:hidden">
                {section.champions.map((champion, index) => {
                  const rowVsClassPct = pctDiff(champion.value, section.average);
                  const rowVsGlobalPct = pctDiff(champion.value, globalAverage);
                  return <Link key={champion.id} href={`/champions/${championSlug(champion.name)}`} className="flex min-w-0 items-center gap-3 p-3 transition-colors hover:bg-pc-bg/50">
                    <span className="w-7 shrink-0 text-center text-xs text-pc-text-muted">#{index + 1}</span>
                    <img src={getChampionIconSafe(champion.name)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-pc-text">{champion.name}</div><div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px]"><span className={rowVsClassPct >= 0 ? "text-emerald-400" : "text-red-400"}>{formatSignedDeltaPercent(rowVsClassPct)} class</span><span className={rowVsGlobalPct >= 0 ? "text-emerald-400" : "text-red-400"}>{formatSignedDeltaPercent(rowVsGlobalPct)} global</span><span className="text-pc-text-muted">{champion.matches.toLocaleString()} matches</span></div></div>
                    <span className="shrink-0 font-mono text-sm font-bold" style={{ color: config.stroke }}>{formatRate(champion.value)}</span>
                  </Link>;
                })}
                {section.champions.length === 0 && <div className="px-3 py-6 text-center text-sm text-pc-text-muted">No champion data</div>}
              </div>

              <div className="hidden overflow-x-auto sm:block">
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
                      const rowVsClass = champion.value - section.average;
                      const rowVsGlobal = champion.value - globalAverage;
                      const rowVsClassPct = pctDiff(champion.value, section.average);
                      const rowVsGlobalPct = pctDiff(champion.value, globalAverage);

                      return (
                        <tr key={champion.id} className="border-b border-pc-border/40 hover:bg-pc-bg/50 transition-colors">
                          <td className="px-3 py-2 text-pc-text-muted">#{index + 1}</td>
                          <td className="px-3 py-2 text-pc-text-muted">#{globalRank.get(champion.name) ?? "-"}</td>
                          <td className="px-3 py-2">
                            <Link href={`/champions/${championSlug(champion.name)}`} className="flex items-center gap-2 min-w-0 group">
                              <img src={getChampionIconSafe(champion.name)} alt={champion.name} className="w-7 h-7 rounded object-contain shrink-0" />
                              <span className="text-pc-text font-medium truncate group-hover:text-pc-accent transition-colors">{champion.name}</span>
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold" style={{ color: config.stroke }}>{formatRate(champion.value)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={rowVsClass >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSigned(rowVsClass)} ({formatSignedDeltaPercent(rowVsClassPct)})
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={rowVsGlobal >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {formatSigned(rowVsGlobal)} ({formatSignedDeltaPercent(rowVsGlobalPct)})
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-pc-text-secondary">{champion.matches.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {section.champions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-pc-text-muted">No champion data</td>
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
