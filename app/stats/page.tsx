"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchChampions,
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

type SortKey = "pickRate" | "winRate";
type ItemCategory = "Defense" | "Utility" | "Healing" | "Offense";
type PageItemStat = { itemId: number; name: string; pickRate: number; winRate: number; category: ItemCategory; icon: string };
type PageMapStat = { name: string; matches: number; distributionRate: number; avgDurationSeconds: number };

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
    itemId: item.itemId,
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
    distributionRate: map.distributionRate,
    avgDurationSeconds: map.avgDurationSeconds,
  }));
}

export default function StatsPage() {
  const [itemSort, setItemSort] = useState<SortKey>("pickRate");
  const [itemSortDir, setItemSortDir] = useState<"asc" | "desc">("desc");
  const [expandedBannedId, setExpandedBannedId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [items, setItems] = useState<PageItemStat[]>([]);
  const [maps, setMaps] = useState<PageMapStat[]>([]);
  const [tiers, setTiers] = useState<TierStat[]>([]);
  const [activeTiers, setActiveTiers] = useState<TierStat[]>([]);

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
    fetchTiers({ source: "matches" }).then(setActiveTiers).catch(() => {});
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

  const sortedMaps = maps;

  // Consolidate tier slices into major tiers for display
  function consolidateTiers(tierData: TierStat[]): TierStat[] {
    const normalized = Array.from({ length: 27 }, (_, index) => {
      const tierSort = index + 1;
      return tierData.find((tier) => tier.tierSort === tierSort) ?? {
        tier: tierSort === 27 ? "Grandmaster" : `Tier ${tierSort}`,
        tierSort,
        totalPlays: 0,
        avgWinRate: 0,
        percentage: 0,
      };
    });
    function sumSlice(start: number, end: number) {
      const slice = normalized.slice(start, end);
      const total = slice.reduce((s, t) => s + t.totalPlays, 0);
      const pct = slice.reduce((s, t) => s + t.percentage, 0);
      return { total, pct };
    }
    return [
      { tier: "Bronze", tierSort: 5, totalPlays: sumSlice(0, 5).total, avgWinRate: 0, percentage: sumSlice(0, 5).pct },
      { tier: "Silver", tierSort: 10, totalPlays: sumSlice(5, 10).total, avgWinRate: 0, percentage: sumSlice(5, 10).pct },
      { tier: "Gold", tierSort: 15, totalPlays: sumSlice(10, 15).total, avgWinRate: 0, percentage: sumSlice(10, 15).pct },
      { tier: "Platinum", tierSort: 20, totalPlays: sumSlice(15, 20).total, avgWinRate: 0, percentage: sumSlice(15, 20).pct },
      { tier: "Diamond", tierSort: 25, totalPlays: sumSlice(20, 25).total, avgWinRate: 0, percentage: sumSlice(20, 25).pct },
      { tier: "Master", tierSort: 26, totalPlays: sumSlice(25, 27).total, avgWinRate: 0, percentage: sumSlice(25, 27).pct },
    ];
  }
  const displayTiers = consolidateTiers(tiers);
  const activeDisplayTiers = consolidateTiers(activeTiers);
  const maxTierCount = Math.max(1, ...displayTiers.map((tier) => tier.totalPlays));
  const maxActiveTierCount = Math.max(1, ...activeDisplayTiers.map((tier) => tier.totalPlays));

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Global Stats</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          Aggregate statistics across all tracked matches
        </p>
      </div>

      {/* ── Global Metrics (consolidated card) + Tier Distribution ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Overview (1/3) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">Performance Overview</h2>
            <Link href="/stats/metrics" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">
              Detail →
            </Link>
          </div>
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

          return (
            <PerformanceOverviewCard metrics={perfRows} />
          );
        })()}
        </div>

        {/* Tier Distribution + Active Ranked (2/3, split 50/50) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">Rank Distribution</h2>
            <Link href="/stats/tiers" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">Detail →</Link>
          </div>
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
            <div className="grid grid-cols-2 gap-0">
              {/* Left: Profile Tier Distribution */}
              <div>
                <div className="text-xs font-semibold text-pc-text-secondary mb-2 px-2">Ranked Player Distribution</div>
                <div className="flex items-end justify-center gap-1.5 h-48 overflow-x-auto pb-2">
                  {displayTiers.map((tier) => {
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
              {/* Right: Active Ranked Match Distribution (with left border divider) */}
              <div className="pl-3 border-l border-pc-border">
                <div className="text-xs font-semibold text-pc-text-secondary mb-2 px-2">Active Ranked Matches</div>
                <div className="flex items-end justify-center gap-1.5 h-48 overflow-x-auto pb-2">
                  {activeDisplayTiers.map((tier) => {
                    const height = Math.max(4, Math.round((tier.totalPlays / maxActiveTierCount) * 116));
                    const rankIcon = getRankIconPath(tier.tierSort, tier.tierSort === 26 ? 101 : tier.tierSort === 27 ? 1 : 0);
                    return (
                      <div key={tier.tierSort} className="flex flex-col items-center justify-end gap-1 min-w-9 h-full group">
                        <div className="text-[9px] text-pc-text-muted tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                          {tier.percentage.toFixed(1)}%
                        </div>
                        <div
                          className="w-5 rounded-t-sm bg-pc-accent-mid/60 group-hover:bg-pc-accent-mid transition-colors"
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
            </div>
          </div>
        </div>
        </section>

      {/* ── Top Champions (win rate + ban rate, consolidated) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <section className="lg:col-span-3 lg:order-1">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-sm font-bold text-pc-text">Top Champions</h2>
          <div className="flex gap-3">
            <Link href="/stats/winrate" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">Win Rate Detail →</Link>
            <Link href="/stats/banrate" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">Ban Rate Detail →</Link>
          </div>
        </div>
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Top Win Rate */}
            <div>
              <div className="text-xs font-semibold text-pc-text-secondary mb-2 px-2">Top Win Rate</div>
              <div className="flex flex-col gap-1">
                {[...champions]
                  .filter((c) => c.winRate != null && Number.isFinite(c.winRate))
                  .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
                  .slice(0, 10)
                  .map((c) => {
                    // This is a win-rate ranking, so its color must be driven
                    // by win rate alone; pick-rate confidence would make lower
                    // win-rate champions appear greener.
                    const quality = getStatQuality(c.winRate!, 1, 1);
                    return (
                      <Link
                        key={c.id}
                        href={`/champions/${championSlug(c.name)}`}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg border border-pc-border/50 bg-pc-card/50 hover:bg-pc-card hover:border-pc-accent-mid transition-all group"
                        style={{ borderColor: quality.borderColor }}
                      >
                        <img
                          src={getChampionIconSafe(c.name)}
                          alt={c.name}
                          className="w-7 h-7 object-contain rounded-full bg-pc-bg/60 shrink-0"
                        />
                        <span className="text-pc-text text-xs font-semibold truncate group-hover:text-pc-accent transition-colors">
                          {c.name}
                        </span>
                        <span className="ml-auto text-sm font-bold tabular-nums" style={{ color: quality.color }}>
                          {c.winRate!.toFixed(1)}%
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Right: Most Banned */}
            <div>
              <div className="text-xs font-semibold text-pc-text-secondary mb-2 px-2">Most Banned</div>
              <div className="flex flex-col gap-1">
                {[...champions]
                  .filter((c) => c.banRate != null && Number.isFinite(c.banRate))
                  .sort((a, b) => (b.banRate ?? 0) - (a.banRate ?? 0))
                  .slice(0, 10)
                  .map((c) => (
                    <Link
                      key={c.id}
                      href={`/champions/${championSlug(c.name)}`}
                      className="flex items-center gap-2 px-2 py-1 rounded-lg border border-pc-border/50 bg-pc-card/50 hover:bg-pc-card hover:border-pc-accent-mid transition-all group"
                    >
                      <img
                        src={getChampionIconSafe(c.name)}
                        alt={c.name}
                        className="w-7 h-7 object-contain rounded-full bg-pc-bg/60 shrink-0"
                      />
                      <span className="text-pc-text text-xs font-semibold truncate group-hover:text-pc-accent transition-colors">
                        {c.name}
                      </span>
                      <span className="ml-auto text-sm font-bold text-rose-400 tabular-nums">
                        {c.banRate!.toFixed(1)}%
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Item Stats + Map Stats ── */}

        {/* Item Stats (3/5) */}
        <section className="lg:col-span-5 lg:order-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">Item Stats</h2>
            <div className="flex items-center gap-2">
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
              <Link href="/stats/items" className="ml-1 text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">
                Detail →
              </Link>
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
                      const quality = getStatQuality(item.winRate, 1, 1);
                      return (
                      <Link
                        key={item.name}
                        href={`/stats/items/${item.itemId}`}
                        className="flex flex-col items-center text-center py-1 rounded-lg border border-transparent transition-colors"
                        style={{ borderColor: quality.borderColor }}
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
                      </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Map Stats (2/5) */}
        <section className="lg:col-span-2 lg:order-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">Map Stats</h2>
            <Link href="/stats/maps" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">Detail →</Link>
          </div>
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
            {sortedMaps.length === 0 ? (
              <div className="p-4 text-sm text-pc-text-muted">Map stats unavailable.</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                  <th className="px-3 py-3">Map</th>
                  <th className="px-2 py-3 text-right">Map Share</th>
                  <th className="px-3 py-3 text-right">Matches</th>
                </tr>
              </thead>
              <tbody>
                {sortedMaps.map((map) => (
                  <tr key={map.name} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                    <td className="px-3 py-2 text-pc-text font-medium text-xs">{map.name}</td>
                    <td className="px-2 py-2 text-xs text-right font-semibold text-pc-accent">{map.distributionRate.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-pc-text text-xs text-right">{map.matches.toLocaleString()}</td>
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
