"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchChampions,
  fetchDatabaseStats,
  fetchItems,
  fetchMapStats,
  fetchPerformanceMetrics,
  fetchTiers,
  type Champion,
  type ItemStat,
  type MapStat,
  type TierStat,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getRankIconPath } from "@/lib/tier-utils";
import { getStatQuality } from "@/lib/stat-quality";
import { PerformanceOverviewCard } from "@/components/PerformanceOverviewCard";

const ROLES = ["Frontline", "Damage", "Flank", "Support"] as const;
const DETAIL_LINK_CLASS = "text-xs text-pc-text-secondary hover:text-pc-accent transition-colors drop-shadow-sm";

type SortKey = "pickRate" | "winRate";
type ItemCategory = "Defense" | "Utility" | "Healing" | "Offense";
type PageItemStat = { name: string; pickRate: number; winRate: number; category: ItemCategory; icon: string };
type PageMapStat = { name: string; matches: number; avgDurationSeconds: number };

const EMPTY_METRICS = {
  dpm: { p10: 0, p25: 0, p75: 0, p90: 0, mean: 0, median: 0, mode: 0 },
  hpm: { p10: 0, p25: 0, p75: 0, p90: 0, mean: 0, median: 0, mode: 0 },
  gpm: { p10: 0, p25: 0, p75: 0, p90: 0, mean: 0, median: 0, mode: 0 },
  mpm: { p10: 0, p25: 0, p75: 0, p90: 0, mean: 0, median: 0, mode: 0 },
  kda: { p10: 0, p25: 0, p75: 0, p90: 0, mean: 0, median: 0, mode: 0 },
};

const ITEM_CATEGORIES: Record<string, ItemCategory> = {
  "Blast Shields": "Defense",
  Guardian: "Defense",
  Haven: "Defense",
  Resilience: "Defense",
  Sentinel: "Defense",
  Chronos: "Utility",
  Hoard: "Utility",
  "Master Riding": "Utility",
  "Morale Boost": "Utility",
  Nimble: "Utility",
  Bloodbath: "Healing",
  "Life Rip": "Healing",
  Meditation: "Healing",
  Rejuvenate: "Healing",
  Veteran: "Healing",
  Bulldozer: "Offense",
  "Deft Hands": "Offense",
  Lethality: "Offense",
  "Trigger Scent": "Offense",
  Wrecker: "Offense",
};

function itemIcon(name: string) {
  return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`;
}

function mapItemStats(items: ItemStat[]): PageItemStat[] {
  const totalUsage = items.reduce((sum, item) => sum + item.totalUsage, 0);
  return items.map((item) => ({
    name: item.itemName,
    pickRate: totalUsage > 0 ? Number(((item.totalUsage / totalUsage) * 100).toFixed(1)) : 0,
    winRate: Number(item.winRate.toFixed(1)),
    category: ITEM_CATEGORIES[item.itemName] ?? "Utility",
    icon: itemIcon(item.itemName),
  }));
}

function mapMapStats(maps: MapStat[]): PageMapStat[] {
  return maps.map((map) => ({
    name: map.name,
    matches: map.totalMatches,
    avgDurationSeconds: map.avgDurationSeconds,
  }));
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function StatsPage() {
  const [itemSort, setItemSort] = useState<SortKey>("pickRate");
  const [itemSortDir, setItemSortDir] = useState<"asc" | "desc">("desc");
  const [mapSortDir, setMapSortDir] = useState<"asc" | "desc">("desc");
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [datasetCounts, setDatasetCounts] = useState({ matches: 0, players: 0 });
  const [items, setItems] = useState<PageItemStat[]>([]);
  const [maps, setMaps] = useState<PageMapStat[]>([]);
  const [tiers, setTiers] = useState<TierStat[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchPerformanceMetrics()
      .then((liveMetrics) => {
        if (cancelled || Object.keys(liveMetrics).length === 0) return;
        setMetrics((current) => ({
          ...current,
          ...Object.fromEntries(Object.entries(liveMetrics).map(([key, summary]) => [key, {
            p10: summary?.p10 ?? 0,
            p25: summary?.p25 ?? 0,
            p75: summary?.p75 ?? 0,
            p90: summary?.p90 ?? 0,
            mean: summary?.mean ?? 0,
            median: summary?.median ?? 0,
            mode: summary?.mode ?? 0,
          }])),
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [champions, setChampions] = useState<Champion[]>([]);
  useEffect(() => {
    fetchChampions().then(setChampions).catch(() => {});
    fetchItems({ mode: "ranked", limit: 50 }).then((rows) => setItems(mapItemStats(rows))).catch(() => {});
    fetchMapStats({ queueId: 486, limit: 25 }).then((rows) => setMaps(mapMapStats(rows))).catch(() => {});
    fetchTiers({ source: "profiles" }).then(setTiers).catch(() => {});
    fetchDatabaseStats()
      .then((stats) => {
        if (!stats) return;
        const tableCounts = new Map(stats.tables.map((table) => [table.name, table.rowCount]));
        setDatasetCounts({
          matches: tableCounts.get("matches") ?? 0,
          players: tableCounts.get("players") ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  const toggleItemSort = (key: SortKey) => {
    if (itemSort === key) {
      setItemSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setItemSort(key);
      setItemSortDir("desc");
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const av = a[itemSort];
    const bv = b[itemSort];
    return itemSortDir === "desc" ? bv - av : av - bv;
  });

  const sortedMaps = [...maps].sort((a, b) => {
    return mapSortDir === "desc" ? b.matches - a.matches : a.matches - b.matches;
  });

  const avgDurationSeconds = maps.reduce((sum, map) => sum + map.avgDurationSeconds * map.matches, 0) / Math.max(1, maps.reduce((sum, map) => sum + map.matches, 0));
  const normalizedTiers = Array.from({ length: 27 }, (_, index) => {
    const tierSort = index + 1;
    return tiers.find((tier) => tier.tierSort === tierSort) ?? {
      tier: tierSort === 27 ? "Grandmaster" : `Tier ${tierSort}`,
      tierSort,
      totalPlays: 0,
      avgWinRate: 0,
      percentage: 0,
    };
  });
  const tierTotal = normalizedTiers.reduce((sum, tier) => sum + tier.totalPlays, 0);
  const maxTierCount = Math.max(1, ...normalizedTiers.map((tier) => tier.totalPlays));
  const maxItemPickRate = Math.max(1, ...items.map((item) => item.pickRate));
  const maxChampionPickRate = Math.max(1, ...champions.map((champion) => champion.pickRate ?? 0));

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Global Stats</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          Aggregate statistics across all tracked matches
        </p>
      </div>

      {/* ── Global Metrics (consolidated card) ── */}
      <section>
        {(() => {
          const perfRows = [
            { key: "dpm", label: "DPM", color: "#f87171" },
            { key: "hpm", label: "HPM", color: "#34d399" },
            { key: "gpm", label: "GPM", color: "#facc15" },
            { key: "mpm", label: "MPM", color: "#60a5fa" },
            { key: "kda", label: "KDA", color: "#33b6b1" },
          ].map(({ key, label, color }) => {
            const d = metrics[key as keyof typeof metrics] as {
              p10: number;
              p25: number;
              p75: number;
              p90: number;
              mean: number;
            };
            return {
              key,
              label,
              color,
              p10: d.p10,
              p25: d.p25,
              mean: d.mean,
              p75: d.p75,
              p90: d.p90,
            };
          });

          const datasetPayload = {
            matches: datasetCounts.matches,
            players: datasetCounts.players,
            avgDuration: formatDuration(avgDurationSeconds),
            avgKda: metrics.kda.mean ? metrics.kda.mean.toFixed(2) : "--",
          };

          return (
            <PerformanceOverviewCard metrics={perfRows} dataset={datasetPayload} />
          );
        })()}
      </section>

      {/* ── Ranked Tier Distribution ── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 px-2">
          <h2 className="text-lg font-bold text-pc-text">Tier Distribution</h2>
          <Link href="/stats/tiers" className={DETAIL_LINK_CLASS}>Detail →</Link>
        </div>
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs text-pc-text-muted">Ranked player profiles</span>
            <span className="text-xs font-semibold text-pc-text tabular-nums">
              {tierTotal.toLocaleString()} players
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-48 overflow-x-auto pb-2">
            {normalizedTiers.map((tier) => {
              const height = Math.max(4, Math.round((tier.totalPlays / maxTierCount) * 116));
              const rankIcon = getRankIconPath(tier.tierSort, tier.tierSort === 26 ? 101 : tier.tierSort === 27 ? 1 : 0);
              return (
                <div key={tier.tierSort} className="flex flex-col items-center justify-end gap-1 min-w-9 h-full group">
                  <div className="text-[9px] text-pc-text-muted tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                    {tier.percentage.toFixed(1)}%
                  </div>
                  <div
                    className="w-5 rounded-t-sm bg-pc-accent-mid group-hover:bg-pc-accent transition-colors"
                    style={{ height }}
                    title={`${tier.tier}: ${tier.totalPlays.toLocaleString()} (${tier.percentage.toFixed(1)}%)`}
                  />
                  <img
                    src={rankIcon}
                    alt={tier.tier}
                    title={tier.tier}
                    className="h-5 w-5 object-contain drop-shadow"
                    loading="lazy"
                  />
                  <div className="text-[9px] text-pc-text-secondary tabular-nums leading-none">
                    {tier.totalPlays.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Top Win Rate by Role ── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 px-2">
          <h2 className="text-lg font-bold text-pc-text">Top Win Rate by Class</h2>
          <Link href="/stats/winrate" className={DETAIL_LINK_CLASS}>Detail →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((role) => {
              const inRole = champions.filter((c) => c.roles?.includes(role));
              const top = [...inRole].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)).slice(0, 4);
              if (top.length === 0) return null;
              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <img
                      src={role === "Frontline" ? "/images/icons/Class_Front_Line_Icon.avif" : `/images/icons/Class_${role}_Icon.avif`}
                      alt={role}
                      className="w-5 h-5"
                    />
                    <h3 className="text-pc-text font-semibold text-sm">{role}</h3>
                  </div>
                  <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors space-y-2">
                    {top.map((c, i) => (
                      <Link key={c.id} href={`/champions/${championSlug(c.name)}`} className="flex items-center gap-2 text-xs group">
                        <span className={`w-4 text-right shrink-0 ${i === 0 ? "text-yellow-400 font-bold" : "text-pc-text-muted"}`}>{i + 1}</span>
                        <img src={getChampionIconSafe(c.name)} alt={c.name} className="w-7 h-7 object-contain rounded shrink-0" />
                        <span className="text-pc-text truncate group-hover:text-pc-accent transition-colors flex-1">{c.name}</span>
                        {(() => {
                          const quality = c.winRate != null ? getStatQuality(c.winRate, c.pickRate, maxChampionPickRate) : null;
                          return (
                            <span className={quality?.textClass ?? "text-pc-text-muted"} style={quality ? { color: quality.color } : undefined}>{c.winRate != null ? `${c.winRate.toFixed(1)}%` : "—"}</span>
                          );
                        })()}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ── Most Banned by Role ── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 px-2">
          <h2 className="text-lg font-bold text-pc-text">Most Banned by Class</h2>
          <Link href="/stats/banrate" className={DETAIL_LINK_CLASS}>Detail →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLES.map((role) => {
              const inRole = champions.filter((c) => c.roles?.includes(role));
              const top = [...inRole].sort((a, b) => (b.banRate ?? 0) - (a.banRate ?? 0)).slice(0, 4);
              if (top.length === 0) return null;
              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <img
                      src={role === "Frontline" ? "/images/icons/Class_Front_Line_Icon.avif" : `/images/icons/Class_${role}_Icon.avif`}
                      alt={role}
                      className="w-5 h-5"
                    />
                    <h3 className="text-pc-text font-semibold text-sm">{role}</h3>
                  </div>
                  <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors space-y-2">
                    {top.map((c, i) => (
                      <Link key={c.id} href={`/champions/${championSlug(c.name)}`} className="flex items-center gap-2 text-xs group">
                        <span className={`w-4 text-right shrink-0 ${i === 0 ? "text-yellow-400 font-bold" : "text-pc-text-muted"}`}>{i + 1}</span>
                        <img src={getChampionIconSafe(c.name)} alt={c.name} className="w-7 h-7 object-contain rounded shrink-0" />
                        <span className="text-pc-text truncate group-hover:text-pc-accent transition-colors flex-1">{c.name}</span>
                        <span className="text-rose-400 font-medium shrink-0">{c.banRate != null ? `${c.banRate.toFixed(1)}%` : "—"}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ── Item Stats + Map Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Item Stats (3/5) */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-pc-text">Item Stats</h2>
            <div className="flex gap-2">
              {(["pickRate", "winRate"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => toggleItemSort(key)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    itemSort === key
                      ? "bg-pc-accent text-pc-bg"
                      : "bg-pc-card text-pc-muted hover:text-pc-text"
                  }`}
                >
                  {key === "pickRate" ? "Pick Rate" : "Win Rate"}
                  {itemSort === key && (itemSortDir === "desc" ? " ↓" : " ↑")}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 space-y-4">
            {sortedItems.length === 0 && (
              <div className="text-sm text-pc-text-muted">Item stats unavailable.</div>
            )}
            {(["Defense", "Utility", "Healing", "Offense"] as const).map((cat) => {
              const catColor = cat === "Offense" ? "text-red-400" :
                cat === "Defense" ? "text-blue-400" :
                cat === "Healing" ? "text-emerald-400" :
                "text-amber-400";
              const catItems = sortedItems.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${catColor} mb-2 block`}>{cat}</span>
                  <div className="grid grid-cols-5 gap-2">
                    {catItems.map((item) => {
                      const quality = getStatQuality(item.winRate, item.pickRate, maxItemPickRate);
                      return (
                      <div
                        key={item.name}
                        className="flex flex-col items-center text-center py-1 rounded-lg border border-transparent transition-colors"
                        style={{ borderColor: quality.borderColor, background: quality.background }}
                      >
                        {item.icon ? (
                          <img src={item.icon} alt={item.name} className="w-12 h-12 object-contain rounded-md mb-1" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-pc-bg flex items-center justify-center mb-1">
                            <span className="text-sm text-pc-text-muted font-bold">{item.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="text-pc-text font-medium text-xs leading-tight truncate w-full">{item.name}</div>
                        <div className="flex items-center gap-1 text-[9px] mt-0.5">
                          <span style={{ color: quality.color }}>
                            WR {item.winRate}%
                          </span>
                          <span className="text-pc-text-muted">·</span>
                          <span style={{ color: quality.color }}>PR {item.pickRate}%</span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Map Stats (2/5) */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-pc-text">Map Stats</h2>
            <button
              onClick={() => setMapSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="text-xs px-2.5 py-1 rounded-lg bg-pc-accent text-pc-bg"
            >
              Most Played {mapSortDir === "desc" ? "↓" : "↑"}
            </button>
          </div>
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
            {sortedMaps.length === 0 ? (
              <div className="p-4 text-sm text-pc-text-muted">Map stats unavailable.</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                  <th className="px-3 py-3 w-8">#</th>
                  <th className="px-3 py-3">Map</th>
                  <th className="px-3 py-3 text-right">Matches</th>
                </tr>
              </thead>
              <tbody>
                {sortedMaps.map((map, i) => (
                  <tr key={map.name} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                    <td className="px-3 py-2 text-pc-text-muted text-xs">{i + 1}</td>
                    <td className="px-3 py-2 text-pc-text font-medium text-xs">{map.name}</td>
                    <td className="px-3 py-2 text-pc-text-secondary text-xs text-right">{map.matches.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
