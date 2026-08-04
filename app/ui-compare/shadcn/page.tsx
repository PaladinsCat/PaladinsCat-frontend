"use client";

import Link from "next/link";
import { ArrowLeft, Trophy, Users, Clock, Activity } from "lucide-react";
import { mockLeaderboard, mockMetrics, mockChampionStats, type MockPlayer, type MockChampionStat } from "../_data";

/* ── shadcn Table ── */
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5 bg-pc-bg-secondary">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-sm font-medium text-pc-text-secondary">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-white/5 hover:bg-pc-bg-elevated/50 transition-colors">{children}</tr>;
}
function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className || ""}`}>{children}</td>;
}

/* ── shadcn Card ── */
function Card({ children }: { children: React.ReactNode }) {
  return <div className="pc-glass rounded-lg border border-white/5 p-6">{children}</div>;
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2">{children}</div>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-medium text-pc-text-secondary">{children}</h3>;
}
function CardContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

/* ── shadcn Badge ── */
function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "outline" | "success" | "warning" }) {
  const variants: Record<string, string> = {
    default: "bg-pc-accent/20 text-pc-accent",
    outline: "border border-white/10 text-pc-text",
    success: "bg-green-500/20 text-green-400",
    warning: "bg-amber-500/20 text-amber-400",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>;
}

/* ── Rank Badge ── */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400">👑</span>;
  if (rank === 2) return <span className="text-gray-300">🥈</span>;
  if (rank === 3) return <span className="text-amber-600">🥉</span>;
  return <span className="text-pc-text-muted text-sm">#{rank}</span>;
}

/* ── Trend Indicator ── */
function Trend({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up") return <span className="text-green-400">↑</span>;
  if (trend === "down") return <span className="text-red-400">↓</span>;
  return <span className="text-pc-text-muted">→</span>;
}

/* ── Tier Badge ── */
function TierBadge({ tier }: { tier: number }) {
  const tierColors: Record<number, string> = {
    26: "bg-purple-500/20 text-purple-400",
    25: "bg-yellow-500/20 text-yellow-400",
    24: "bg-blue-500/20 text-blue-400",
    23: "bg-green-500/20 text-green-400",
    22: "bg-cyan-500/20 text-cyan-400",
  };
  const tierNames: Record<number, string> = {
    26: "GM", 25: "D1", 24: "D2", 23: "D3", 22: "D4",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierColors[tier] || "bg-gray-500/20 text-gray-400"}`}>
      {tierNames[tier] || `T${tier}`}
    </span>
  );
}

export default function ShadcnPage() {
  return (
    <div className="min-h-screen bg-pc-bg p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/ui-compare" className="p-2 hover:bg-pc-bg-elevated rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-pc-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-pc-text">shadcn/ui</h1>
            <p className="text-sm text-pc-text-secondary">Tailwind-native primitives · class-variance-authority · Radix UI</p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, ...mockMetrics[0] },
            { icon: Trophy, ...mockMetrics[1] },
            { icon: Clock, ...mockMetrics[2] },
            { icon: Activity, ...mockMetrics[3] },
          ].map((m) => (
            <Card key={m.label}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pc-text">{m.value}</div>
                <span className={`text-sm ${m.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {m.change >= 0 ? "+" : ""}{m.change}%
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="inline-flex items-center rounded-lg bg-pc-bg-secondary p-1 gap-1 mb-4">
          <span className="px-3 py-1.5 text-sm rounded-md bg-pc-bg-elevated text-pc-text font-medium">Ranked Leaderboard</span>
          <span className="px-3 py-1.5 text-sm rounded-md text-pc-text-secondary hover:text-pc-text cursor-pointer">Champion Stats</span>
        </div>

        {/* Leaderboard */}
        <div className="mt-2">
          <Table headers={["Rank", "Player", "Tier", "Glicko", "Win Rate", "Matches", "Main", "Trend"]}>
            {mockLeaderboard.map((p: MockPlayer) => (
              <TableRow key={p.rank}>
                <TableCell className="w-12"><RankBadge rank={p.rank} /></TableCell>
                <TableCell>
                  <div className="font-medium text-pc-text">{p.playerName}</div>
                  <div className="text-xs text-pc-text-muted">{p.platform}</div>
                </TableCell>
                <TableCell><TierBadge tier={p.tier} /></TableCell>
                <TableCell className="font-mono text-pc-text">{p.glicko.toFixed(1)}</TableCell>
                <TableCell>
                  <span className={p.winRate >= 60 ? "text-green-400 font-medium" : p.winRate >= 55 ? "text-amber-400" : "text-pc-text-secondary"}>
                    {p.winRate}%
                  </span>
                </TableCell>
                <TableCell className="text-pc-text-secondary">{p.totalMatches.toLocaleString()}</TableCell>
                <TableCell className="text-pc-text-secondary">{p.mainChampion}</TableCell>
                <TableCell><Trend trend={p.trend} /></TableCell>
              </TableRow>
            ))}
          </Table>
        </div>

        {/* Champion Stats */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-pc-text mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-pc-accent" />
            Champion Win Rates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockChampionStats.map((c: MockChampionStat) => (
              <Card key={c.name}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-pc-text">{c.name}</span>
                  <Badge variant={c.tier === "S" ? "success" : c.tier === "A" ? "warning" : "outline"}>
                    Tier {c.tier}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-pc-text-muted text-xs">Win Rate</div>
                    <div className={`font-medium ${c.winRate >= 52 ? "text-green-400" : "text-pc-text"}`}>{c.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-xs">Pick Rate</div>
                    <div className="font-medium text-pc-text">{c.pickRate}%</div>
                  </div>
                  <div>
                    <div className="text-pc-text-muted text-xs">Ban Rate</div>
                    <div className="font-medium text-pc-text">{c.banRate}%</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-pc-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-pc-accent transition-all"
                    style={{ width: `${Math.max(c.winRate, 10)}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
