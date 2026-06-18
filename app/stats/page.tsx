"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchChampions,
  fetchDatabaseStats,
  fetchItems,
  fetchMapStats,
  fetchPerformanceMetrics,
  type Champion,
  type ItemStat,
  type MapStat,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";

const ROLES = ["Frontline", "Damage", "Flank", "Support"] as const;

type SortKey = "pickRate" | "winRate";
type ItemCategory = "Defense" | "Utility" | "Healing" | "Offense";
type PageItemStat = { name: string; pickRate: number; winRate: number; category: ItemCategory; icon: string };
type PageMapStat = { name: string; matches: number; avgDurationSeconds: number };

const EMPTY_METRICS = {
  dpm: { min: 0, max: 0, mean: 0, median: 0, mode: 0 },
  hpm: { min: 0, max: 0, mean: 0, median: 0, mode: 0 },
  gpm: { min: 0, max: 0, mean: 0, median: 0, mode: 0 },
  mpm: { min: 0, max: 0, mean: 0, median: 0, mode: 0 },
  kda: { min: 0, max: 0, mean: 0, median: 0, mode: 0 },
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

  useEffect(() => {
    let cancelled = false;
    fetchPerformanceMetrics()
      .then((liveMetrics) => {
        if (cancelled || Object.keys(liveMetrics).length === 0) return;
        setMetrics((current) => ({
          ...current,
          ...Object.fromEntries(Object.entries(liveMetrics).map(([key, summary]) => [key, {
            min: summary?.min ?? 0,
            max: summary?.max ?? 0,
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

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Global Stats</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          Aggregate statistics across all tracked matches
        </p>
      </div>

      {/* ── Global Metrics ── */}
      <section>
        <h2 className="text-lg font-bold text-pc-text mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: "dpm", label: "Damage / Min", stroke: "#f87171", fill: "rgba(248,113,113,0.15)" },
            { key: "hpm", label: "Healing / Min", stroke: "#34d399", fill: "rgba(52,211,153,0.15)" },
            { key: "gpm", label: "Credits / Min", stroke: "#facc15", fill: "rgba(250,204,21,0.15)" },
            { key: "mpm", label: "Mitigation / Min", stroke: "#60a5fa", fill: "rgba(96,165,250,0.15)" },
            { key: "kda", label: "KDA Ratio", stroke: "#33b6b1", fill: "rgba(51,182,177,0.15)" },
          ].map(({ key, label, stroke, fill }) => {
            const d = metrics[key as keyof typeof metrics] as { min: number; max: number; mean: number; mode: number };
            const range = Math.max(1, d.max - d.min);
            const meanPct = (d.mean - d.min) / range;
            const modePct = (d.mode - d.min) / range;
            const formatVal = key === "kda" ? (v: number) => v.toFixed(1) : (v: number) => v.toLocaleString();

            // Generate bell curve points — skewed so mode != mean
            const W = 280;
            const H = 60;
            const sigma = 0.18; // controls spread
            const points: string[] = [];
            for (let i = 0; i <= W; i++) {
              const x = i / W;
              // Blend two gaussians centered at mean and mode for a realistic skewed shape
              const g1 = Math.exp(-0.5 * ((x - meanPct) / sigma) ** 2);
              const g2 = Math.exp(-0.5 * ((x - modePct) / (sigma * 0.8)) ** 2);
              const y = 0.6 * g1 + 0.4 * g2;
              const px = i;
              const py = H - y * (H - 4);
              points.push(`${px},${py}`);
            }
            const linePath = `M0,${H} L${points.join(" L")} L${W},${H} Z`;

            return (
              <div key={key} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 hover:border-pc-accent-mid transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-pc-text font-semibold text-sm">{label}</span>
                  <Link
                    href={`/stats/${key}`}
                    className="text-[10px] px-2 py-0.5 rounded bg-pc-bg text-pc-accent hover:bg-pc-accent hover:text-pc-bg transition-colors"
                  >
                    Detail →
                  </Link>
                </div>

                {/* Bell curve SVG */}
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16 mb-1" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Fill */}
                  <path d={linePath} fill={`url(#grad-${key})`} />
                  {/* Stroke */}
                  <path
                    d={`M${points.join(" L")}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Mean line */}
                  <line x1={meanPct * W} y1="0" x2={meanPct * W} y2={H} stroke={stroke} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                  {/* Mode line */}
                  <line x1={modePct * W} y1="4" x2={modePct * W} y2={H} stroke="#6a6a71" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
                  {/* Mean dot */}
                  <circle cx={meanPct * W} cy="2" r="3" fill={stroke} />
                  {/* Mode dot */}
                  <circle cx={modePct * W} cy="6" r="2.5" fill="#6a6a71" />
                </svg>

                {/* Legend dots */}
                <div className="flex items-center gap-4 mb-2">
                  <span className="flex items-center gap-1 text-[10px] text-pc-text-muted">
                    <span className="w-2 h-2 rounded-full" style={{ background: stroke }} /> Mean
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-pc-text-muted">
                    <span className="w-2 h-2 rounded-full bg-pc-text-muted" /> Mode
                  </span>
                </div>

                {/* Min / Mode / Mean / Max */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-pc-text-muted">min <span className="text-pc-text-secondary">{formatVal(d.min)}</span></span>
                  <span className="text-pc-text-muted">mode <span className="text-pc-text-secondary">{formatVal(d.mode)}</span></span>
                  <span className="text-pc-text-muted">mean <span className="font-bold" style={{ color: stroke }}>{formatVal(d.mean)}</span></span>
                  <span className="text-pc-text-muted">max <span className="text-pc-text-secondary">{formatVal(d.max)}</span></span>
                </div>
              </div>
            );
          })}

          {/* Summary stats card */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 space-y-3">
            <span className="text-pc-text font-semibold text-sm">Dataset</span>
            {[
              { label: "Matches Tracked", value: datasetCounts.matches.toLocaleString() },
              { label: "Players Tracked", value: datasetCounts.players.toLocaleString() },
              { label: "Avg Match Duration", value: formatDuration(avgDurationSeconds) },
              { label: "Avg KDA", value: metrics.kda.mean ? metrics.kda.mean.toFixed(2) : "--" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-pc-text-muted text-xs">{m.label}</span>
                <span className="text-pc-text font-medium text-xs">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Win Rate by Role ── */}
      <section>
        <h2 className="text-lg font-bold text-pc-text mb-4">Top Win Rate by Class</h2>
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map((role) => {
              const inRole = champions.filter((c) => c.roles?.includes(role));
              const top = [...inRole].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)).slice(0, 4);
              if (top.length === 0) return null;
              return (
                <div key={role} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-pc-border">
                    <img
                      src={role === "Frontline" ? "/images/icons/Class_Front_Line_Icon.avif" : `/images/icons/Class_${role}_Icon.avif`}
                      alt={role}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-pc-text-muted">{role}</span>
                  </div>
                  <div className="space-y-2">
                    {top.map((c, i) => (
                      <Link key={c.id} href={`/champions/${championSlug(c.name)}`} className="flex items-center gap-2 text-xs group">
                        <span className={`w-4 text-right shrink-0 ${i === 0 ? "text-yellow-400 font-bold" : "text-pc-text-muted"}`}>{i + 1}</span>
                        <img src={getChampionIconSafe(c.name)} alt={c.name} className="w-7 h-7 object-contain rounded shrink-0" />
                        <span className="text-pc-text truncate group-hover:text-pc-accent transition-colors flex-1">{c.name}</span>
                        <span className="text-emerald-400 font-medium shrink-0">{c.winRate != null ? `${c.winRate.toFixed(1)}%` : "—"}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Most Banned by Role ── */}
      <section>
        <h2 className="text-lg font-bold text-pc-text mb-4">Most Banned by Class</h2>
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map((role) => {
              const inRole = champions.filter((c) => c.roles?.includes(role));
              const top = [...inRole].sort((a, b) => (b.banRate ?? 0) - (a.banRate ?? 0)).slice(0, 4);
              if (top.length === 0) return null;
              return (
                <div key={role} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-pc-border">
                    <img
                      src={role === "Frontline" ? "/images/icons/Class_Front_Line_Icon.avif" : `/images/icons/Class_${role}_Icon.avif`}
                      alt={role}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium text-pc-text-muted">{role}</span>
                  </div>
                  <div className="space-y-2">
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
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${catColor} mb-2 block`}>{cat}</span>
                  <div className="grid grid-cols-5 gap-2">
                    {catItems.map((item) => (
                      <div key={item.name} className="flex flex-col items-center text-center py-1">
                        {item.icon ? (
                          <img src={item.icon} alt={item.name} className="w-12 h-12 object-contain rounded-md mb-1" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-pc-bg flex items-center justify-center mb-1">
                            <span className="text-sm text-pc-text-muted font-bold">{item.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="text-pc-text font-medium text-[10px] leading-tight truncate w-full">{item.name}</div>
                        <div className="flex items-center gap-1 text-[9px] mt-0.5">
                          <span className={item.winRate >= 50 ? "text-emerald-400" : "text-red-400"}>
                            WR {item.winRate}%
                          </span>
                          <span className="text-pc-text-muted">·</span>
                          <span className="text-pc-text-muted">PR {item.pickRate}%</span>
                        </div>
                      </div>
                    ))}
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
