"use client";

import Link from "next/link";
import { Card, Chip, Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { mockLeaderboard, mockMetrics, mockChampionStats, type MockPlayer, type MockChampionStat } from "../_data";

export default function HeroUIPage() {
  return (
    <div className="min-h-screen bg-[#1b1b1f] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/ui-compare" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">HeroUI</h1>
            <p className="text-sm text-gray-400">React Aria-based accessible components</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {mockMetrics.map((m) => (
            <Card.Root key={m.label} className="bg-[#202127] border border-white/5">
              <Card.Header className="pb-2">
                <span className="text-sm text-gray-400">{m.label}</span>
              </Card.Header>
              <div className="h-px bg-white/5 mx-4" />
              <Card.Content className="pt-2">
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className={`text-sm ${m.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {m.change >= 0 ? "+" : ""}{m.change}%
                </p>
              </Card.Content>
            </Card.Root>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button color="primary" variant="flat" size="sm">
            Ranked Leaderboard
          </Button>
          <Button variant="bordered" size="sm" isDisabled>
            Champion Stats
          </Button>
        </div>

        {/* Leaderboard as Cards */}
        <h2 className="text-lg font-semibold text-white mb-4">Ranked Leaderboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {mockLeaderboard.map((p: MockPlayer) => (
            <Card.Root key={p.rank} className="bg-[#202127] border border-white/5 hover:border-primary/30 transition-colors">
              <Card.Header className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {p.rank === 1 ? "👑" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{p.playerName}</p>
                    <p className="text-xs text-gray-400">{p.platform}</p>
                  </div>
                </div>
              </Card.Header>
              <div className="h-px bg-white/5 mx-4" />
              <Card.Content className="pt-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Tier:</span>{" "}
                    <Chip color="warning" size="sm">{p.tierName}</Chip>
                  </div>
                  <div>
                    <span className="text-gray-400">Glicko:</span> <span className="font-mono text-white">{p.glicko.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Win Rate:</span>{" "}
                    <span className={p.winRate >= 60 ? "text-green-400 font-medium" : "text-white"}>{p.winRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Matches:</span> <span className="text-white">{p.totalMatches.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Main:</span> <span className="text-white">{p.mainChampion}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Trend:</span>{" "}
                    <span className={p.trend === "up" ? "text-green-400" : p.trend === "down" ? "text-red-400" : "text-gray-500"}>
                      {p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "→"}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card.Root>
          ))}
        </div>

        {/* Champion Cards */}
        <h2 className="text-lg font-semibold text-white mb-4">Champion Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockChampionStats.map((c: MockChampionStat) => (
            <Card.Root key={c.name} className="bg-[#202127] border border-white/5 hover:border-primary/30 transition-colors">
              <Card.Header className="pb-2">
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-white">{c.name}</span>
                  <Chip color={c.tier === "S" ? "success" : c.tier === "A" ? "warning" : "default"} size="sm">
                    Tier {c.tier}
                  </Chip>
                </div>
              </Card.Header>
              <div className="h-px bg-white/5 mx-4" />
              <Card.Content className="pt-3">
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
                <div className="h-2 bg-[#161618] rounded-full overflow-hidden mt-3">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(c.winRate, 10)}%` }} />
                </div>
              </Card.Content>
            </Card.Root>
          ))}
        </div>
      </div>
    </div>
  );
}
