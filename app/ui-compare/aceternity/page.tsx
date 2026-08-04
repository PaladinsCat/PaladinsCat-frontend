"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Users, Clock, Activity } from "lucide-react";
import { mockLeaderboard, mockMetrics, mockChampionStats, type MockPlayer, type MockChampionStat } from "../_data";

/* Aceternity-style: Spotlight card effect, moving borders, animated backgrounds */

function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/5 bg-[#202127] p-6 ${className || ""}`}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(110, 220, 180, 0.06), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function MovingBorderCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-[1px] rounded-xl overflow-hidden">
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: "conic-gradient(from 0deg, transparent, rgba(110, 220, 180, 0.3), transparent, transparent)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative bg-[#202127] rounded-xl p-6">{children}</div>
    </div>
  );
}

function BackgroundGradientAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
}

export default function AceternityPage() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "champions">("leaderboard");

  return (
    <div className="min-h-screen bg-[#1b1b1f] relative overflow-hidden p-8">
      <BackgroundGradientAnimation />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/ui-compare" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent"
            >
              Aceternity UI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-400"
            >
              Animation-heavy React components with Framer Motion
            </motion.p>
          </div>
        </div>

        {/* Animated Metric Cards with Moving Border */}
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
              <MovingBorderCard>
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-gray-400">{m.label}</span>
                </div>
                <div className="text-2xl font-bold text-white">{m.value}</div>
                <span className={`text-sm ${m.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {m.change >= 0 ? "+" : ""}{m.change}%
                </span>
              </MovingBorderCard>
            </motion.div>
          ))}
        </div>

        {/* Animated Tabs */}
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
              <SpotlightCard>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-teal-400" />
                  Ranked Leaderboard
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        {["Rank", "Player", "Tier", "Glicko", "Win Rate", "Matches", "Main", "Trend"].map((h) => (
                          <th key={h} className="px-4 py-3 text-sm font-medium text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockLeaderboard.map((p: MockPlayer, i: number) => (
                        <motion.tr
                          key={p.rank}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">{p.rank === 1 ? "👑" : `#${p.rank}`}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{p.playerName}</div>
                            <div className="text-xs text-gray-500">{p.platform}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              p.tier >= 25 ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"
                            }`}>
                              {p.tierName}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-white">{p.glicko.toFixed(1)}</td>
                          <td className="px-4 py-3">
                            <span className={p.winRate >= 60 ? "text-green-400 font-medium" : p.winRate >= 55 ? "text-amber-400" : "text-gray-400"}>
                              {p.winRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{p.totalMatches.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-400">{p.mainChampion}</td>
                          <td className="px-4 py-3">
                            <span className={p.trend === "up" ? "text-green-400" : p.trend === "down" ? "text-red-400" : "text-gray-500"}>
                              {p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "→"}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SpotlightCard>
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
                    transition={{ delay: i * 0.1 }}
                  >
                    <SpotlightCard>
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
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(c.winRate, 10)}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        />
                      </div>
                    </SpotlightCard>
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
