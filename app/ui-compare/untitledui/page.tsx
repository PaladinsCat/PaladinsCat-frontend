"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Trophy, Users, Clock, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { mockLeaderboard, mockMetrics, mockChampionStats } from "../_data";

/*
 * Untitled UI - Figma-to-code design system approach
 * Clean, professional, enterprise-style components with consistent spacing
 * Emphasis on typography hierarchy, consistent card layouts, and accessible design
 */

/* ── Untitled UI Card ── */
function UICard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className || ""}`}>{children}</div>
  );
}

/* ── Untitled UI Table ── */
function UITable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((h) => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}

/* ── Untitled UI Badge ── */
function UIBadge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "yellow" | "red" | "purple" }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

/* ── Untitled UI Tabs ── */
function UITabs({ activeTab, onTabChange, tabs }: { activeTab: string; onTabChange: (tab: string) => void; tabs: { value: string; label: string }[] }) {
  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === tab.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ── Untitled UI Stat Card ── */
function UIStatCard({ icon: Icon, label, value, change }: { icon: any; label: string; value: string; change: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className={`text-sm font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}

/* ── Untitled UI Avatar ── */
function UIAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className={`${sizes[size]} rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600`}>
      {initials}
    </div>
  );
}

export default function UntitledUIPage() {
  const [activeTab, setActiveTab] = useState("leaderboard");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/ui-compare" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Untitled UI</h1>
            <p className="text-sm text-gray-500">Figma-to-code design system · Enterprise components</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Leaderboard</span>
        </nav>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <UIStatCard icon={Users} label="Active Players" value={mockMetrics[0].value} change={mockMetrics[0].change} />
          <UIStatCard icon={Trophy} label="Matches Today" value={mockMetrics[1].value} change={mockMetrics[1].change} />
          <UIStatCard icon={Clock} label="Avg Duration" value={mockMetrics[2].value} change={mockMetrics[2].change} />
          <UIStatCard icon={Activity} label="Server Uptime" value={mockMetrics[3].value} change={mockMetrics[3].change} />
        </div>

        {/* Tabs */}
        <UITabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { value: "leaderboard", label: "Ranked Leaderboard" },
            { value: "champions", label: "Champion Stats" },
          ]}
        />

        {/* Leaderboard */}
        {activeTab === "leaderboard" && (
          <div className="mt-6">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-blue-500" />
                    Ranked Leaderboard
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                      Rank
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                      Glicko
                    </button>
                  </div>
                </div>
              </div>
              <UITable headers={["Rank", "Player", "Tier", "Glicko", "Win Rate", "Matches", "Main", "Trend"]}>
                {mockLeaderboard.map((p) => (
                  <tr key={p.rank} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.rank === 1 ? (
                        <span className="text-yellow-500">👑</span>
                      ) : p.rank === 2 ? (
                        <span className="text-gray-400">🥈</span>
                      ) : p.rank === 3 ? (
                        <span className="text-amber-600">🥉</span>
                      ) : (
                        <span className="text-sm text-gray-600">#{p.rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UIAvatar name={p.playerName} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{p.playerName}</div>
                          <div className="text-xs text-gray-500">{p.platform}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UIBadge color={p.tier >= 25 ? "yellow" : "blue"}>{p.tierName}</UIBadge>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{p.glicko.toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${p.winRate >= 60 ? "text-green-600" : p.winRate >= 55 ? "text-yellow-600" : "text-gray-900"}`}>
                        {p.winRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.totalMatches.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.mainChampion}</td>
                    <td className="px-6 py-4">
                      <span className={p.trend === "up" ? "text-green-600" : p.trend === "down" ? "text-red-600" : "text-gray-400"}>
                        {p.trend === "up" ? (
                          <ChevronUp className="w-4 h-4 inline-block" />
                        ) : p.trend === "down" ? (
                          <ChevronDown className="w-4 h-4 inline-block" />
                        ) : (
                          <span className="text-xs">→</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </UITable>
            </div>
          </div>
        )}

        {/* Champion Stats */}
        {activeTab === "champions" && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockChampionStats.map((c) => (
              <div key={c.name} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                  <UIBadge color={c.tier === "S" ? "green" : c.tier === "A" ? "yellow" : "blue"}>
                    Tier {c.tier}
                  </UIBadge>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</div>
                    <div className={`text-lg font-semibold ${c.winRate >= 52 ? "text-green-600" : "text-gray-900"}`}>
                      {c.winRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pick Rate</div>
                    <div className="text-lg font-semibold text-gray-900">{c.pickRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ban Rate</div>
                    <div className="text-lg font-semibold text-gray-900">{c.banRate}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(c.winRate, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
