"use client";

import { useState } from "react";
import {
  MOCK_ITEM_STATS,
  MOCK_MAP_STATS,
  MOCK_GLOBAL_METRICS,
} from "@/lib/mock-data";

type SortKey = "pickRate" | "winRate";

export default function StatsPage() {
  const [itemSort, setItemSort] = useState<SortKey>("pickRate");
  const [itemSortDir, setItemSortDir] = useState<"asc" | "desc">("desc");
  const [mapSortDir, setMapSortDir] = useState<"asc" | "desc">("desc");

  const toggleItemSort = (key: SortKey) => {
    if (itemSort === key) {
      setItemSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setItemSort(key);
      setItemSortDir("desc");
    }
  };

  const sortedItems = [...MOCK_ITEM_STATS].sort((a, b) => {
    const av = a[itemSort];
    const bv = b[itemSort];
    return itemSortDir === "desc" ? bv - av : av - bv;
  });

  const sortedMaps = [...MOCK_MAP_STATS].sort((a, b) => {
    return mapSortDir === "desc" ? b.matches - a.matches : a.matches - b.matches;
  });

  const metrics = MOCK_GLOBAL_METRICS;
  const maxItemPick = Math.max(...MOCK_ITEM_STATS.map((i) => i.pickRate));
  const maxMapMatches = Math.max(...MOCK_MAP_STATS.map((m) => m.matches));

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
            { key: "gpm", label: "Gold / Min", stroke: "#facc15", fill: "rgba(250,204,21,0.15)" },
            { key: "mpm", label: "Mitigation / Min", stroke: "#60a5fa", fill: "rgba(96,165,250,0.15)" },
            { key: "kda", label: "KDA Ratio", stroke: "#33b6b1", fill: "rgba(51,182,177,0.15)" },
          ].map(({ key, label, stroke, fill }) => {
            const d = metrics[key as keyof typeof metrics] as { min: number; max: number; mean: number; mode: number };
            const range = d.max - d.min;
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
                  <span className="text-[10px] uppercase tracking-wider">
                    <span className="text-pc-text-muted">mean </span>
                    <span className="font-bold" style={{ color: stroke }}>{formatVal(d.mean)}</span>
                  </span>
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
                  <span className="text-pc-text-muted">max <span className="text-pc-text-secondary">{formatVal(d.max)}</span></span>
                </div>
              </div>
            );
          })}

          {/* Summary stats card */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 space-y-3">
            <span className="text-pc-text font-semibold text-sm">Dataset</span>
            {[
              { label: "Matches Tracked", value: metrics.totalMatchesTracked.toLocaleString() },
              { label: "Players Tracked", value: metrics.totalPlayersTracked.toLocaleString() },
              { label: "Avg Match Duration", value: metrics.avgMatchDuration },
              { label: "Avg KDA", value: metrics.avgKDA },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-pc-text-muted text-xs">{m.label}</span>
                <span className="text-pc-text font-medium text-xs">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Item Stats ── */}
      <section>
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
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Pick Rate</th>
                <th className="px-4 py-3">Win Rate</th>
                <th className="px-4 py-3 hidden sm:table-cell">Popularity</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.name} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={item.icon} alt={item.name} className="w-6 h-6 object-contain" />
                      <span className="text-pc-text font-medium text-xs">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.category === "Offense" ? "bg-red-500/10 text-red-400" :
                      item.category === "Utility" ? "bg-blue-500/10 text-blue-400" :
                      item.category === "Defense" ? "bg-amber-500/10 text-amber-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-pc-text-secondary text-xs">{item.pickRate}%</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={item.winRate >= 50 ? "text-emerald-400" : "text-red-400"}>
                      {item.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <div className="w-24 h-1.5 bg-pc-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-pc-accent"
                        style={{ width: `${(item.pickRate / maxItemPick) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Map Stats ── */}
      <section>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                <th className="px-4 py-3 w-8">#</th>
                <th className="px-4 py-3">Map</th>
                <th className="px-4 py-3">Matches</th>
                <th className="px-4 py-3">Avg Duration</th>
                <th className="px-4 py-3 hidden sm:table-cell">Activity</th>
              </tr>
            </thead>
            <tbody>
              {sortedMaps.map((map, i) => (
                <tr key={map.name} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                  <td className="px-4 py-2.5 text-pc-text-muted text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 text-pc-text font-medium text-xs">{map.name}</td>
                  <td className="px-4 py-2.5 text-pc-text-secondary text-xs">{map.matches.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-pc-text-secondary text-xs">{map.avgDuration}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <div className="w-24 h-1.5 bg-pc-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pc-accent-deep to-pc-accent"
                        style={{ width: `${(map.matches / maxMapMatches) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
