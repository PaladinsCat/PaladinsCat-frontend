"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { mockLeaderboard, mockMetrics, mockChampionStats } from "../_data";

/* DaisyUI uses Tailwind utility classes enhanced by DaisyUI's component system.
   This prototype uses DaisyUI classes directly: table, card, badge, tabs, stats, stats-figure */

export default function DaisyUIPage() {
  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/ui-compare" className="btn btn-ghost btn-sm btn-square">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-base-content">DaisyUI</h1>
            <p className="text-sm text-base-content/60">Tailwind components with theme system</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-100">
          {mockMetrics.map((m) => (
            <div key={m.label} className="stat">
              <div className="stat-title">{m.label}</div>
              <div className="stat-value text-primary">{m.value}</div>
              <div className={`stat-desc ${m.change >= 0 ? "text-success" : "text-error"}`}>
                {m.change >= 0 ? "+" : ""}{m.change}% from yesterday
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs tabs-lifted tabs-lg mt-8">
          <a className="tab tab-active">Ranked Leaderboard</a>
          <a className="tab">Champion Stats</a>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto mt-4">
          <table className="table table-zebra bg-base-100 rounded-box">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Tier</th>
                <th>Glicko</th>
                <th>Win Rate</th>
                <th>Matches</th>
                <th>Main</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((p) => (
                <tr key={p.rank} className="hover">
                  <td>
                    <div className="badge badge-outline badge-primary">#{p.rank}</div>
                  </td>
                  <td>
                    <div className="font-bold">{p.playerName}</div>
                    <div className="text-xs opacity-50">{p.platform}</div>
                  </td>
                  <td>
                    <div className={`badge ${p.tier >= 25 ? "badge-warning" : "badge-info"}`}>
                      {p.tierName}
                    </div>
                  </td>
                  <td className="font-mono">{p.glicko.toFixed(1)}</td>
                  <td>
                    <span className={p.winRate >= 60 ? "text-success font-bold" : p.winRate >= 55 ? "text-warning" : ""}>
                      {p.winRate}%
                    </span>
                  </td>
                  <td>{p.totalMatches.toLocaleString()}</td>
                  <td>{p.mainChampion}</td>
                  <td>
                    <span className={p.trend === "up" ? "text-success" : p.trend === "down" ? "text-error" : "text-base-content/50"}>
                      {p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "→"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Champion Cards */}
        <h2 className="text-xl font-bold text-base-content mt-8 mb-4">Champion Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockChampionStats.map((c) => (
            <div key={c.name} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-lg">{c.name}</h3>
                  <div className={`badge ${
                    c.tier === "S" ? "badge-success" :
                    c.tier === "A" ? "badge-warning" :
                    c.tier === "B" ? "badge-info" : "badge-ghost"
                  }`}>
                    Tier {c.tier}
                  </div>
                </div>
                <div className="flex gap-4 text-sm mt-2">
                  <div>
                    <div className="text-base-content/50">Win Rate</div>
                    <div className={`font-bold ${c.winRate >= 52 ? "text-success" : ""}`}>{c.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-base-content/50">Pick Rate</div>
                    <div className="font-bold">{c.pickRate}%</div>
                  </div>
                  <div>
                    <div className="text-base-content/50">Ban Rate</div>
                    <div className="font-bold">{c.banRate}%</div>
                  </div>
                </div>
                <progress className="progress progress-primary mt-2" value={c.winRate} max="100"></progress>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
