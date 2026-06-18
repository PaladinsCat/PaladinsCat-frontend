"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchBaselines, type BaselineEntry } from "@/lib/api-client";
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-bold">#{rank}</span>;
  if (rank === 2) return <span className="text-gray-300 font-bold">#{rank}</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">#{rank}</span>;
  return <span className="text-pc-text-muted">#{rank}</span>;
}

export default function MetricLeaderboardPage() {
  const params = useParams();
  const metric = params.metric as string;

  const [baselines, setBaselines] = useState<BaselineEntry[]>([]);

  useEffect(() => {
    fetchBaselines()
      .then(setBaselines)
      .catch(() => {});
  }, []);

  if (!VALID_METRICS.includes(metric as Metric)) {
    return (
      <div className="min-h-screen bg-pc-bg text-pc-text p-6">
        <Link href="/players" className="text-pc-text-muted hover:text-pc-text underline text-sm">
          ← Back to Players
        </Link>
        <div className="mt-12 text-center">
          <h1 className="text-2xl font-bold text-red-400">Invalid Metric</h1>
          <p className="text-pc-text-muted mt-2">
            &quot;{metric}&quot; is not a valid metric. Choose from: GPM, HPM, DPM, MPM.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            {VALID_METRICS.map((m) => (
              <Link
                key={m}
                href={`/players/stats/${m}`}
                className="px-4 py-2 rounded-lg border border-pc-border hover:border-pc-text-muted transition-colors"
                style={{ color: METRIC_COLORS[m] }}
              >
                {m.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const m = metric as Metric;
  const entries = MOCK_PERF_LEADERBOARD[m] ?? [];
  const color = METRIC_COLORS[m];

  const avgByRole = baselines.reduce<Record<string, number>>((acc, b) => {
    const val = b[METRIC_AVG_KEY[m]] as number;
    if (val) acc[b.role] = val;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-pc-bg text-pc-text p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/players" className="text-pc-text-muted hover:text-pc-text underline text-sm">
          ← Back to Players
        </Link>
        <h1 className="text-3xl font-bold mt-2" style={{ color }}>
          {METRIC_LABELS[m]} Leaderboard
        </h1>
        <p className="text-pc-text-muted text-sm mt-1">
          Top players ranked by {METRIC_LABELS[m].toLowerCase()}
        </p>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {VALID_METRICS.map((tab) => (
          <Link
            key={tab}
            href={`/players/stats/${tab}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === m
                ? "border-2"
                : "border border-pc-border hover:border-pc-text-muted text-pc-text-muted"
            }`}
            style={
              tab === m
                ? { borderColor: METRIC_COLORS[tab], color: METRIC_COLORS[tab] }
                : undefined
            }
          >
            {tab.toUpperCase()} — {METRIC_LABELS[tab]}
          </Link>
        ))}
      </div>

      {/* Baselines summary */}
      {Object.keys(avgByRole).length > 0 && (
        <div className="bg-pc-card rounded-xl border border-pc-border p-4 mb-6">
          <h2 className="text-sm font-semibold text-pc-text-muted mb-3 uppercase tracking-wider">
            Role Averages (Baselines)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(avgByRole).map(([role, val]) => (
              <div
                key={role}
                className="bg-pc-bg/50 rounded-lg p-3 border border-pc-border"
              >
                <div className="flex items-center gap-2 mb-1">
                  {CLASS_ICONS[role] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={CLASS_ICONS[role]} alt={role} className="w-5 h-5" />
                  )}
                  <span className="text-xs text-pc-text-muted">{role}</span>
                </div>
                <span className="text-lg font-bold" style={{ color }}>
                  {val.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pc-border text-pc-text-muted text-left">
              <th className="py-3 px-3 w-16">Rank</th>
              <th className="py-3 px-3">Player</th>
              <th className="py-3 px-3">Champion</th>
              <th className="py-3 px-3">Class</th>
              <th className="py-3 px-3 text-right">{METRIC_LABELS[m]}</th>
              <th className="py-3 px-3 text-right">Matches</th>
              <th className="py-3 px-3">Region</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              return (
                <tr
                  key={entry.player_id}
                  className={`border-b border-pc-border/50 hover:bg-pc-card/50 transition-colors ${
                    isTop3 ? "bg-pc-card/30" : ""
                  }`}
                >
                  <td className="py-3 px-3">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href={`/players/${entry.player_id}`}
                      className="text-pc-text hover:underline font-medium"
                    >
                      {entry.name}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-pc-text-muted">{entry.champion}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {CLASS_ICONS[entry.className] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={CLASS_ICONS[entry.className]}
                          alt={entry.className}
                          className="w-4 h-4"
                        />
                      )}
                      <span className="text-pc-text-muted text-xs">{entry.className}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold" style={{ color }}>
                    {entry.value.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-pc-text-muted">
                    {entry.totalMatches.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-pc-text-muted text-xs">{entry.region}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-pc-text-muted">
          No data available for this metric.
        </div>
      )}
    </div>
  );
}
