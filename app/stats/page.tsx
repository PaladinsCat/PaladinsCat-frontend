"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchStatsPageData,
  type Champion,
  type MatchCompositionStat,
  type SkinStat,
  type BrokenSkinStat,
  type TierStat,
  type BaselineEntry,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getRankIconPath } from "@/lib/tier-utils";
import { getStatQuality } from "@/lib/stat-quality";
import { PerformanceOverviewCard } from "@/components/PerformanceOverviewCard";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { ContentFade } from "@/components/async-state";
import { ChartCardSkeleton, DataCardSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";

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

function mapItemStats(items: Array<{ itemId: number; itemName: string; totalUsage: number; winRate: number }>): PageItemStat[] {
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

function mapMapStats(maps: Array<{ name: string; totalMatches: number; distributionRate: number; avgDurationSeconds: number }>): PageMapStat[] {
  return maps.map((map) => ({
    name: map.name,
    matches: map.totalMatches,
    distributionRate: map.distributionRate,
    avgDurationSeconds: map.avgDurationSeconds,
  }));
}

export default function StatsPage() {
  const { t , formatPercent, formatNumber} = useLocalization();
  const { definition: lobbyTier, ready: lobbyTierReady } = useLobbyTier();
  const [itemSort, setItemSort] = useState<SortKey>("pickRate");
  const [itemSortDir, setItemSortDir] = useState<"asc" | "desc">("desc");
  const [expandedBannedId, setExpandedBannedId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [items, setItems] = useState<PageItemStat[]>([]);
  const [maps, setMaps] = useState<PageMapStat[]>([]);
  const [tiers, setTiers] = useState<TierStat[]>([]);
  const [egpmBaselines, setEgpmBaselines] = useState<BaselineEntry[]>([]);
  const [skinStats, setSkinStats] = useState<SkinStat[]>([]);
  const [compositions, setCompositions] = useState<MatchCompositionStat[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [egpmLoading, setEgpmLoading] = useState(true);
  const [skinsLoading, setSkinsLoading] = useState(true);
  const [compositionsLoading, setCompositionsLoading] = useState(true);
  const [brokenSkins, setBrokenSkins] = useState<BrokenSkinStat[]>([]);
  const [brokenSkinsLoading, setBrokenSkinsLoading] = useState(true);

  useEffect(() => {
    if (!lobbyTierReady) return;
    let cancelled = false;
    setOverviewLoading(true);
    setEgpmLoading(true);
    setSkinsLoading(true);
    setCompositionsLoading(true);
    setBrokenSkinsLoading(true);
    fetchStatsPageData({ tierMin: lobbyTier.tierMin, tierMax: lobbyTier.tierMax })
      .then((data) => {
        if (cancelled) return;
        const liveMetrics = data.overview.metrics;
        if (Object.keys(liveMetrics).length > 0) {
          setMetrics((current) => ({
            ...current,
            ...Object.fromEntries(Object.entries(liveMetrics).map(([key, summary]) => [key, {
              p10: summary?.p10 ?? 0, p25: summary?.p25 ?? 0, p75: summary?.p75 ?? 0, p90: summary?.p90 ?? 0,
              mean: summary?.mean ?? 0, median: summary?.median ?? 0, mode: summary?.mode ?? 0,
            }])),
          }));
        }
        setChampions(data.overview.champions);
        setItems(mapItemStats(data.overview.items));
        setMaps(mapMapStats(data.overview.maps));
        setTiers(data.overview.profileTiers);
        setEgpmBaselines(data.baselines);
        setSkinStats(data.skins);
        setCompositions(data.compositions);
        setBrokenSkins(data.brokenSkins);
      })
      .catch(() => {
        if (cancelled) return;
        setEgpmBaselines([]);
        setSkinStats([]);
        setCompositions([]);
        setBrokenSkins([]);
      })
      .finally(() => {
        if (cancelled) return;
        setOverviewLoading(false);
        setEgpmLoading(false);
        setSkinsLoading(false);
        setCompositionsLoading(false);
        setBrokenSkinsLoading(false);
      });
    return () => { cancelled = true; };
  }, [lobbyTierReady, lobbyTier.tierMax, lobbyTier.tierMin]);

  const [champions, setChampions] = useState<Champion[]>([]);

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
        tier: tierSort === 27 ? t("generated.stats.page.grandmaster") : `Tier ${tierSort}`,
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
      { tier: t("generated.stats.page.bronze"), tierSort: 5, totalPlays: sumSlice(0, 5).total, avgWinRate: 0, percentage: sumSlice(0, 5).pct },
      { tier: t("generated.stats.page.silver"), tierSort: 10, totalPlays: sumSlice(5, 10).total, avgWinRate: 0, percentage: sumSlice(5, 10).pct },
      { tier: t("generated.stats.page.gold"), tierSort: 15, totalPlays: sumSlice(10, 15).total, avgWinRate: 0, percentage: sumSlice(10, 15).pct },
      { tier: t("generated.stats.page.platinum"), tierSort: 20, totalPlays: sumSlice(15, 20).total, avgWinRate: 0, percentage: sumSlice(15, 20).pct },
      { tier: t("generated.stats.page.diamond"), tierSort: 25, totalPlays: sumSlice(20, 25).total, avgWinRate: 0, percentage: sumSlice(20, 25).pct },
      { tier: t("generated.stats.page.master"), tierSort: 26, totalPlays: sumSlice(25, 27).total, avgWinRate: 0, percentage: sumSlice(25, 27).pct },
    ];
  }
  const displayTiers = consolidateTiers(tiers);
  const maxTierCount = Math.max(1, ...displayTiers.map((tier) => tier.totalPlays));
  const baselineOrder = [t("generated.stats.page.global"), "Damage", "Flank", "Support", "Frontline"];
  const orderedEgpmBaselines = [...egpmBaselines].sort((a, b) => baselineOrder.indexOf(a.role) - baselineOrder.indexOf(b.role));

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.stats.globalStats.bd3846d")}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          {t("generated.stats.aggregateStatisticsAcrossAllTrackedMatches")}</p>
      </div>

      {/* ── Performance, eCPM, and ranked-player distribution ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.performanceOverview")}</h2>
            <Link href="/stats/metrics" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">
              {t("generated.stats.detail")}</Link>
          </div>
        {overviewLoading ? (
          <DataCardSkeleton rows={5} />
        ) : <ContentFade className="flex-1">{(() => {
          const perfRows = [
            { key: "dpm", label: t("generated.stats.dpm"), color: "#f87171" },
            { key: "hpm", label: t("generated.stats.hpm"), color: "#34d399" },
            { key: "gpm", label: t("generated.stats.cpm"), color: "#facc15" },
            { key: "mpm", label: t("generated.stats.spm"), color: "#60a5fa" },
            { key: "kda", label: t("generated.stats.kda"), color: "#33b6b1" },
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
        })()}</ContentFade>}
        </div>

        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.ecpmByRole")}</h2>
            <Link href="/stats/egpm" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">{t("generated.stats.detail")}</Link>
          </div>
          {egpmLoading ? <DataCardSkeleton rows={5} /> : (
            <ContentFade className="flex-1">
              <PerformanceOverviewCard metrics={orderedEgpmBaselines.map((row) => ({
                key: `egpm-${row.role}`,
                label: row.role === "Frontline" ? t("common.roles.frontlineShort") : row.role === "Support" ? t("common.roles.supportShort") : row.role === "Damage" ? t("common.roles.damageShort") : row.role === "Global" ? t("common.roles.global") : t("common.roles.flank"),
                color: row.role === "Global" ? "#facc15" : row.role === "Damage" ? "#f87171" : row.role === "Flank" ? "#c084fc" : row.role === "Support" ? "#34d399" : "#60a5fa",
                p10: row.p10Ecpm,
                p25: row.p25Ecpm,
                mean: row.avgEcpm,
                p75: row.p75Ecpm,
                p90: row.p90Ecpm,
              }))} />
            </ContentFade>
          )}
        </div>

        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.rankedPlayerDistribution")}</h2>
            <Link href="/stats/tiers" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">{t("generated.stats.detail")}</Link>
          </div>
          {overviewLoading ? <ChartCardSkeleton /> : <ContentFade className="flex-1 bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
            <div className="flex h-full min-h-48 items-end justify-center gap-1.5 pb-2">
              {displayTiers.map((tier) => {
                const height = Math.max(4, Math.round((tier.totalPlays / maxTierCount) * 116));
                const rankIcon = getRankIconPath(tier.tierSort, tier.tierSort === 26 ? 101 : tier.tierSort === 27 ? 1 : 0);
                return (
                  <div key={tier.tierSort} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <div className="text-[9px] text-pc-text-muted tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{formatPercent(tier.percentage)}</div>
                    <div className="w-5 rounded-t-sm bg-pc-accent-mid group-hover:bg-pc-accent transition-colors" style={{ height }} title={t("generated.stats.value1Value2Value3", { value1: tier.tier, value2: formatNumber(tier.totalPlays), value3: formatNumber(tier.percentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })} />
                    <img src={rankIcon} alt={tier.tier} title={tier.tier} className="h-5 w-5 object-contain drop-shadow" loading="lazy" />
                    <div className="text-[9px] text-pc-text-secondary tabular-nums leading-none">{formatNumber(tier.totalPlays)}</div>
                  </div>
                );
              })}
            </div>
          </ContentFade>}
        </div>
      </section>

      {/* ── Top Champions (win rate + ban rate, consolidated) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <section className="lg:col-span-3 lg:order-1">
        <div className="pc-section-heading mb-3 px-1 sm:px-2">
          <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.topChampions")}</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/stats/winrate" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">{t("generated.stats.winRateDetail")}</Link>
            <Link href="/stats/banrate" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">{t("generated.stats.banRateDetail")}</Link>
          </div>
        </div>
        {overviewLoading ? <DataCardSkeleton rows={10} columns={2} /> : <ContentFade className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
          <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 min-[480px]:gap-4">
            {/* Left: Top Win Rate */}
            <div>
              <div className="text-xs font-semibold text-pc-text-secondary mb-2 px-2">{t("generated.stats.topWinRate")}</div>
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
                          {formatPercent(c.winRate!)}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Right: Most Banned */}
            <div>
              <div className="text-xs font-semibold text-pc-text-secondary mb-2 px-2">{t("generated.stats.mostBanned")}</div>
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
                        {formatPercent(c.banRate!)}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </ContentFade>}
      </section>

      {/* ── Item Stats + Map Stats ── */}

        {/* Item Stats (3/5) */}
        <section className="lg:col-span-5 lg:order-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.itemStats")}</h2>
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
                  {key === "pickRate" ? t("generated.stats.pickRate") : t("generated.stats.winRate.49a3838")}
                  {itemSort === key && (itemSortDir === "desc" ? " ↓" : " ↑")}
                </button>
              ))}
              <Link href="/stats/items" className="ml-1 text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">
                {t("generated.stats.detail")}</Link>
            </div>
          </div>
          {overviewLoading ? <DataCardSkeleton rows={4} columns={2} /> : <ContentFade className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 space-y-4">
            {sortedItems.length === 0 && (
              <div className="text-sm text-pc-text-muted">{t("generated.stats.itemStatsUnavailable")}</div>
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
                            {t("generated.stats.wr")}{" "}{item.winRate}%
                          </span>
                          <span className="text-pc-text-muted">·</span>
                          <span style={{ color: quality.color }}>{t("generated.stats.pr")}{" "}{item.pickRate}%</span>
                        </div>
                      </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </ContentFade>}
        </section>

        {/* Map Stats (2/5) */}
        <section className="lg:col-span-2 lg:order-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.mapStats")}</h2>
            <Link href="/stats/maps" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">{t("generated.stats.detail")}</Link>
          </div>
          {overviewLoading ? <DataCardSkeleton rows={8} /> : <ContentFade className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
            {sortedMaps.length === 0 ? (
              <div className="p-4 text-sm text-pc-text-muted">{t("generated.stats.mapStatsUnavailable")}</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                  <th className="px-3 py-3">{t("generated.stats.map")}</th>
                  <th className="px-2 py-3 text-right">{t("generated.stats.mapShare")}</th>
                  <th className="px-3 py-3 text-right">{t("generated.stats.matches")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedMaps.map((map) => (
                  <tr key={map.name} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                    <td className="px-3 py-2 text-pc-text font-medium text-xs">{map.name}</td>
                    <td className="px-2 py-2 text-xs text-right font-semibold text-pc-accent">{formatPercent(map.distributionRate)}</td>
                    <td className="px-3 py-2 text-pc-text text-xs text-right">{formatNumber(map.matches)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </ContentFade>}
        </section>

      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.skinStats")}</h2>
              <p className="text-[11px] text-pc-text-muted">{t("generated.stats.rankedCosmeticsIncludingRecoveredSkinIds")}</p>
            </div>
            <Link href="/stats/skins" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">{t("generated.stats.detail")}</Link>
          </div>
          {skinsLoading ? <DataCardSkeleton rows={5} /> : <ContentFade className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
            {skinStats.length === 0 ? <div className="p-4 text-sm text-pc-text-muted">{t("generated.stats.skinStatsUnavailable")}</div> : (
              <div className="divide-y divide-pc-border/50">
                {skinStats.map((skin) => (
                  <Link key={`${skin.championId}-${skin.skinId}`} href={`/stats/skins?champion=${skin.championId}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-pc-bg-secondary/60">
                    <img src={getChampionIconSafe(skin.championName)} alt="" className="h-7 w-7 rounded object-contain" />
                    <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-pc-text">{skin.skinName}</div><div className="text-[10px] text-pc-text-muted">{skin.championName} · {formatNumber(skin.totalPlays)} {t("generated.stats.plays.0effba4")}</div></div>
                    <span className="text-xs font-bold text-emerald-400">{formatPercent(skin.winRate)}</span>
                  </Link>
                ))}
              </div>
            )}
          </ContentFade>}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.compositionStats")}</h2>
              <p className="text-[11px] text-pc-text-muted">{t("generated.stats.teamShapeFrontlineDamageFlankSupport")}</p>
            </div>
            <Link href="/stats/compositions" className="text-xs text-pc-text-secondary hover:text-pc-accent transition-colors">{t("generated.stats.detail")}</Link>
          </div>
          {compositionsLoading ? <DataCardSkeleton rows={5} /> : <ContentFade className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
            {compositions.length === 0 ? <div className="p-4 text-sm text-pc-text-muted">{t("generated.stats.compositionStatsUnavailable")}</div> : (
              <div className="divide-y divide-pc-border/50">
                {compositions.slice(0, 5).map((composition) => (
                  <Link key={composition.composition} href="/stats/compositions" className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-pc-bg-secondary/60">
                    <div className="w-20 font-mono text-xs font-semibold text-pc-text">{composition.composition}</div>
                    <div className="min-w-0 flex-1 text-[10px] text-pc-text-muted">{formatNumber(composition.totalMatches)} {t("generated.stats.rankedMatches")}</div>
                    <span className={composition.winRate >= 50 ? "text-xs font-bold text-emerald-400" : "text-xs font-bold text-rose-400"}>{formatPercent(composition.winRate)}</span>
                  </Link>
                ))}
              </div>
            )}
          </ContentFade>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.brokenSkins")}</h2>
              <p className="text-[11px] text-pc-text-muted">{t("generated.stats.int16OverflowSkinId32767UsageSharePerChampion")}</p>
            </div>
          </div>
          {brokenSkinsLoading ? <DataCardSkeleton rows={5} /> : <ContentFade className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
            {brokenSkins.length === 0 ? <div className="p-4 text-sm text-pc-text-muted">{t("generated.stats.noBrokenSkinData")}</div> : (
              <div className="divide-y divide-pc-border/50">
                {brokenSkins.map((skin) => (
                  <div key={`${skin.championId}-${skin.skinId}`} className="flex items-center gap-3 px-4 py-2.5">
                    <img src={getChampionIconSafe(skin.championName)} alt="" className="h-7 w-7 rounded object-contain" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-pc-text">{skin.skinName}</div>
                      <div className="text-[10px] text-pc-text-muted">{skin.championName} · {formatNumber(skin.totalPlays)} {t("generated.stats.plays.0effba4")}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-400">{formatNumber(skin.usageShare, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{t("generated.stats.share.b95bb2e")}</span>
                      <div className="text-[9px] text-pc-text-muted">{t("generated.stats.wr")}{" "}{formatPercent(skin.winRate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ContentFade>}
        </div>
      </section>
    </div>
  );
}
