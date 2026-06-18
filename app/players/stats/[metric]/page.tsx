"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchBaselines, fetchPerformanceLeaderboard, type BaselineEntry } from "@/lib/api-client";
import { MOCK_PERF_LEADERBOARD } from "@/lib/mock-data";

const VALID_METRICS = ["gpm", "hpm", "dpm", "mpm"] as const;
type Metric = (typeof VALID_METRICS)[number];

const METRIC_LABELS: Record<Metric, string> = {
  gpm: "Gold / Min",
  hpm: "Healing / Min",
  dpm: "Damage / Min",
  mpm: "Mitigation / Min",
};

const METRIC_COLORS: Record<Metric, string> = {
  gpm: "text-yellow-400",
  hpm: "text-emerald-400",
  dpm: "text-red-400",
  mpm: "text-blue-400",
};

const METRIC_HEX: Record<Metric, string> = {
  gpm: "#facc15",
  hpm: "#34d399",
  dpm: "#f87171",
  mpm: "#60a5fa",
};

const METRIC_AVG_KEY: Record<Metric, keyof BaselineEntry> = {
  gpm: "avgGpm",
  hpm: "avgHpm",
  dpm: "avgDpm",
  mpm: "avgMpm",
};

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

interface PerfEntry {
  rank: number;
  player_id: number;
  name: string;
  champion: string;
  className: string;
  value: number;
  totalMatches: number;
  region: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 font-bold text-sm">
        🥉
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-pc-text-muted text-sm">
      {rank}
    </span>
  );
}

export default function MetricLeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const rawMetric = (params.metric as string)?.toLowerCase();

  const normalizedMetric = VALID_METRICS.find((m) => m === rawMetric) || null;

  const [baselines, setBaselines] = useState<BaselineEntry[]>([]);
  const [entries, setEntries] = useState<PerfEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!normalizedMetric) {
      router.replace("/players/stats/dpm");
      return;
    }
    let cancelled = false;
    const metric = normalizedMetric;

    async function load() {
      setLoading(true);
      try {
        const [baselineRows, leaderboardRows] = await Promise.all([
          fetchBaselines(),
          fetchPerformanceLeaderboard({ metric, limit: 100 }),
        ]);
        if (cancelled) return;
        setBaselines(baselineRows);
        if (leaderboardRows.length > 0) {
          setEntries(leaderboardRows.map((p) => ({
            rank: p.rank,
            player_id: p.playerId,
            name: p.playerName,
            champion: p.championName ?? "—",
            className: p.className ?? "Unknown",
            value: p.value,
            totalMatches: p.totalMatches,
            region: p.region ?? "—",
          })));
        } else {
          setEntries(MOCK_PERF_LEADERBOARD[metric] ?? []);
        }
      } catch {
        if (!cancelled) {
          setBaselines([]);
          setEntries(MOCK_PERF_LEADERBOARD[metric] ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedMetric, router]);

  if (!normalizedMetric) return null;

  const m = normalizedMetric;
  const colorClass = METRIC_COLORS[m];

  const avgByRole = baselines.reduce<Record<string, number>>((acc, b) => {
    const val = b[METRIC_AVG_KEY[m]] as number;
    if (val) acc[b.role] = val;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href="/players"
          className="text-pc-text-muted hover:text-pc-accent transition-colors text-sm flex items-center gap-1"
        >
          ← Players
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="pc-heading pc-heading-lg">
          <span className={colorClass}>{METRIC_LABELS[m]}</span>{" "}
          <span className="text-pc-text">Leaderboard</span>
        </h1>
      </div>

      {/* ── Metric Selector Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {VALID_METRICS.map((tab) => (
          <Link
            key={tab}
            href={`/players/stats/${tab}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === m
                ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/40"
                : "bg-pc-bg-elevated text-pc-text-muted border border-pc-border hover:border-pc-accent-mid hover:text-pc-text"
            }`}
          >
            {METRIC_LABELS[tab]}
          </Link>
        ))}
      </div>

      {/* ── Baselines summary ── */}
      {Object.keys(avgByRole).length > 0 && (
        <div className="bg-pc-bg-elevated rounded-xl border border-pc-border p-4">
          <h2 className="text-sm font-semibold text-pc-text-muted mb-3 uppercase tracking-wider">
            Role Averages (Baselines)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(avgByRole).map(([role, val]) => (
              <div key={role} className="bg-pc-bg/50 rounded-lg p-3 border border-pc-border">
                <div className="flex items-center gap-2 mb-1">
                  {CLASS_ICONS[role] && (
                    <img src={CLASS_ICONS[role]} alt={role} className="w-5 h-5" />
                  )}
                  <span className="text-xs text-pc-text-muted">{role}</span>
                </div>
                <span className={`text-lg font-bold ${colorClass}`}>
                  {val.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="text-center py-20 text-pc-text-muted">
          Loading {METRIC_LABELS[m]} leaderboard...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-pc-text-muted">
          No data available for {METRIC_LABELS[m]}.
        </div>
      ) : (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border">
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-14">Rank</th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4">Player</th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden sm:table-cell">Champion</th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Class</th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4">{METRIC_LABELS[m]}</th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Matches</th>
                  <th className="text-center text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">Region</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((p, i) => {
                  const rowBg = i < 3 ? "bg-pc-bg/30" : "";
                  return (
                    <tr
                      key={p.player_id}
                      className={`border-b border-pc-border/50 hover:bg-pc-bg/60 transition-colors ${rowBg}`}
                    >
                      <td className="py-2.5 px-4">
                        <RankBadge rank={p.rank} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/players/${p.player_id}`}
                          className="text-pc-text font-medium hover:text-pc-accent transition-colors"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-pc-text-secondary hidden sm:table-cell">
                        {p.champion}
                      </td>
                      <td className="py-2.5 px-4 hidden md:table-cell">
                        <span className="flex items-center gap-2 text-xs">
                          {CLASS_ICONS[p.className] && (
                            <img src={CLASS_ICONS[p.className]} alt={p.className} className="w-4 h-4" />
                          )}
                          <span className="text-pc-text-muted">{p.className}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`font-bold ${colorClass}`}>
                          {p.value.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                        {p.totalMatches.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center hidden lg:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded bg-pc-bg text-pc-text-muted">
                          {p.region}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer note ── */}
      <p className="text-pc-text-muted text-xs text-center">
        Showing {entries.length} players — {METRIC_LABELS[m]} is a rolling average across ranked matches.
      </p>
    </div>
  );
}
