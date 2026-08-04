"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Clock, Activity } from "lucide-react";
import { mockLeaderboard, mockMetrics, mockChampionStats, type MockPlayer, type MockChampionStat } from "../_data";

/* MagicUI-style: marquee, number-ticker, bento-grid, sparkles, shimmer effects */

function SparklesCore() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-px bg-teal-400/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

function NumberTicker({ value }: { value: string }) {
  const numeric = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
  const [display, setDisplay] = useState(0);

  return (
    <span>
      {(() => {
        if (display === 0) {
          const steps = 30;
          const increment = numeric / steps;
          let start = 0;
          const timer = setInterval(() => {
            start += increment;
            if (start >= numeric) {
              clearInterval(timer);
              setDisplay(numeric);
            } else {
              setDisplay(Math.floor(start));
            }
          }, 66);
        }
        return display.toLocaleString();
      })()}
    </span>
  );
}

function Marquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="text-lg font-bold text-white/20 uppercase tracking-wider">{item}</span>
        ))}
      </motion.div>
    </div>
  );
}

function BentoCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-[#202127] p-6 hover:border-teal-500/30 transition-colors ${className || ""}`}>
      {children}
    </div>
  );
}

export default function MagicUIPage() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "champions">("leaderboard");

  return (
    <div className="min-h-screen bg-[#1b1b1f] p-8 relative">
      <SparklesCore />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/ui-compare" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent"
            >
              MagicUI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-400"
            >
              Next.js animation components · Marquee · NumberTicker · Bento Grid
            </motion.p>
          </div>
        </div>

        {/* Marquee Banner */}
        <div className="mb-8 -mx-8 px-8 overflow-hidden bg-[#161618] py-3">
          <Marquee items={mockChampionStats.map((c) => c.name)} />
        </div>

        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, ...mockMetrics[0] },
            { icon: Trophy, ...mockMetrics[1] },
            { icon: Clock, ...mockMetrics[2] },
            { icon: Activity, ...mockMetrics[3] },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <BentoCard>
                <div className="flex items-center gap-2 mb-3">
                  <m.icon className="w-5 h-5 text-teal-400" />
                  <span className="text-sm text-gray-400">{m.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{m.value}</div>
                <span className={`text-sm ${m.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {m.change >= 0 ? "+" : ""}{m.change}%
                </span>
              </BentoCard>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["leaderboard", "champions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "leaderboard" ? "Ranked Leaderboard" : "Champion Stats"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "leaderboard" ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <BentoCard className="p-0 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-teal-400" />
                    Ranked Leaderboard
                  </h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Rank", "Player", "Tier", "Glicko", "Win Rate", "Matches", "Main", "Trend"].map((h) => (
                        <th key={h} className="px-6 py-3 text-sm font-medium text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockLeaderboard.map((p: MockPlayer, i: number) => (
                      <motion.tr
                        key={p.rank}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm">
                          {p.rank === 1 ? "👑" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{p.playerName}</div>
                          <div className="text-xs text-gray-500">{p.platform}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            p.tier >= 25 ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {p.tierName}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-white">{p.glicko.toFixed(1)}</td>
                        <td className="px-6 py-4">
                          <span className={p.winRate >= 60 ? "text-green-400 font-medium" : "text-gray-400"}>
                            {p.winRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{p.totalMatches.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-400">{p.mainChampion}</td>
                        <td className="px-6 py-4">
                          <span className={p.trend === "up" ? "text-green-400" : p.trend === "down" ? "text-red-400" : "text-gray-500"}>
                            {p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "→"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </BentoCard>
            </motion.div>
          ) : (
            <motion.div
              key="champions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockChampionStats.map((c: MockChampionStat, i: number) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <BentoCard>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-white">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          c.tier === "S" ? "bg-green-500/20 text-green-400" :
                          c.tier === "A" ? "bg-amber-500/20 text-amber-400" : "bg-gray-500/20 text-gray-400"
                        }`}>
                          Tier {c.tier}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs">Win Rate</div>
                          <div className={`font-medium ${c.winRate >= 52 ? "text-green-400" : "text-white"}`}>{c.winRate}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Pick Rate</div>
                          <div className="font-medium text-white">{c.pickRate}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Ban Rate</div>
                          <div className="font-medium text-white">{c.banRate}%</div>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 bg-[#161618] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(c.winRate, 10)}%` }}
                          transition={{ duration: 1, delay: i * 0.08 }}
                        />
                      </div>
                    </BentoCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
