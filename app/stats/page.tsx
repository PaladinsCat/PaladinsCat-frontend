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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Avg DPM", value: metrics.avgDPM.toLocaleString(), color: "text-red-400" },
            { label: "Avg HPM", value: metrics.avgHPM.toLocaleString(), color: "text-emerald-400" },
            { label: "Avg GPM", value: metrics.avgGPM.toLocaleString(), color: "text-yellow-400" },
            { label: "Avg MPM", value: metrics.avgMPM.toLocaleString(), color: "text-blue-400" },
            { label: "Avg KDA", value: metrics.avgKDA, color: "text-pc-accent" },
          ].map((m) => (
            <div key={m.label} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 text-center hover:border-pc-accent-mid transition-colors">
              <div className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-1">{m.label}</div>
              <div className={`font-bold text-lg ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {[
            { label: "Matches Tracked", value: metrics.totalMatchesTracked.toLocaleString() },
            { label: "Players Tracked", value: metrics.totalPlayersTracked.toLocaleString() },
            { label: "Avg Duration", value: metrics.avgMatchDuration },
            { label: "KDA Ratio", value: metrics.kdaRatio.toFixed(2) },
          ].map((m) => (
            <div key={m.label} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-3 text-center hover:border-pc-accent-mid transition-colors">
              <div className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-0.5">{m.label}</div>
              <div className="text-pc-text font-semibold text-sm">{m.value}</div>
            </div>
          ))}
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
                  <td className="px-4 py-2.5 text-pc-text font-medium text-xs">{item.name}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.category === "Offense" ? "bg-red-500/10 text-red-400" :
                      item.category === "Utility" ? "bg-blue-500/10 text-blue-400" :
                      item.category === "Armor" ? "bg-amber-500/10 text-amber-400" :
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
                <th className="px-4 py-3">Attack WR</th>
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
                  <td className="px-4 py-2.5 text-xs">
                    <span className={map.winRateAttack >= 50 ? "text-emerald-400" : "text-red-400"}>
                      {map.winRateAttack}%
                    </span>
                  </td>
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
