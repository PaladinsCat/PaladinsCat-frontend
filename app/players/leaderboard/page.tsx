"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchRankedLeaderboard, type RankedPlayer } from "@/lib/api-client";
import { TIER_NAMES } from "@/lib/mock-data";
import { championSlug } from "@/lib/utils"; // available for champion links if needed

const TIER_TABS = [
  { tier: 21, label: "Diamond V" },
  { tier: 22, label: "Diamond IV" },
  { tier: 23, label: "Diamond III" },
  { tier: 24, label: "Diamond II" },
  { tier: 25, label: "Diamond I" },
  { tier: 26, label: "Master" },
  { tier: 27, label: "Grandmaster" },
] as const;

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-bold">{rank}</span>;
  if (rank === 2) return <span className="text-gray-300 font-bold">{rank}</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold">{rank}</span>;
  return <span className="text-pc-text-muted">{rank}</span>;
}

export default function LeaderboardPage() {
  const [tier, setTier] = useState(26);
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRankedLeaderboard({ tier: String(tier), top: 100 });
        if (cancelled) return;
        setPlayers(data);
      } catch {
        if (!cancelled) setError("Failed to load leaderboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tier]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/players"
          className="text-pc-text-muted hover:text-pc-accent transition-colors text-sm"
        >
          ← Back to Players
        </Link>
      </div>
      <h1 className="pc-heading pc-heading-lg text-pc-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
        Ranked Leaderboard
      </h1>

      {/* Tier selector tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {TIER_TABS.map((t) => (
          <button
            key={t.tier}
            onClick={() => setTier(t.tier)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
              tier === t.tier
                ? "bg-pc-accent text-pc-bg"
                : "pc-surface text-pc-muted hover:text-pc-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-pc-text-muted text-sm animate-pulse">Loading leaderboard...</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="pc-card text-center py-8">
          <p className="text-pc-text-muted">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && players.length === 0 && (
        <div className="pc-card text-center py-8">
          <p className="text-pc-text-muted">No ranked players found for this tier.</p>
        </div>
      )}

      {/* Leaderboard table */}
      {!loading && !error && players.length > 0 && (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border">
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-12">
                    Rank
                  </th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4">
                    Player
                  </th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden sm:table-cell">
                    Tier
                  </th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4">
                    Points
                  </th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4 w-16">
                    Trend
                  </th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">
                    Region
                  </th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">
                    Win Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr
                    key={p.player_id}
                    className={`border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors ${
                      i < 3 ? "bg-pc-bg/30" : ""
                    }`}
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
                    <td className="py-2.5 px-4 text-pc-text-secondary text-xs hidden sm:table-cell">
                      {TIER_NAMES[p.tier] || `Tier ${p.tier}`}
                    </td>
                    <td className="py-2.5 px-4 text-right text-pc-text font-medium">
                      {p.points.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {p.trend != null && p.trend !== 0 ? (
                        <span
                          className={`text-xs ${
                            p.trend > 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {p.trend > 0 ? "▲" : "▼"}
                          {Math.abs(p.trend)}
                        </span>
                      ) : (
                        <span className="text-pc-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-pc-text-muted text-xs hidden md:table-cell">
                      {(p as any).region || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right text-xs">
                      {(p as any).winRate != null ? (
                        <span className="text-emerald-400 font-medium">
                          {(p as any).winRate}%
                        </span>
                      ) : (
                        <span className="text-pc-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
