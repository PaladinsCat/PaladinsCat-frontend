"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchClassLeaderboard, type ClassLeaderboardEntry } from "@/lib/api-client";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">🥇</span>;
  if (rank === 2)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">🥈</span>;
  if (rank === 3)
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 font-bold text-sm">🥉</span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 text-pc-text-muted text-sm">{rank}</span>;
}

export default function AccountEloPage() {
  const [players, setPlayers] = useState<ClassLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        /*
         * Account ELO is one row per player from player_queue_ratings. The
         * shared backend endpoint still validates a role parameter because its
         * original contract was class/champion ELO; mode=account intentionally
         * ignores that role so this page does not mix champion dimensions into
         * the account leaderboard.
         */
        const data = await fetchClassLeaderboard({
          role: "Frontline",
          limit: 100,
          queueId: 486,
          mode: "account",
        });
        if (!cancelled) setPlayers(data);
      } catch {
        if (!cancelled) setError("Failed to load account ELO leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return players;
    return players.filter((p) => p.playerName.toLowerCase().includes(query));
  }, [players, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">← Players</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Account ELO</h1>
        <p className="text-pc-text-muted text-sm mt-2">
          Ranked account ratings from completed match snapshots.
        </p>
      </div>

      <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-pc-text font-semibold text-sm">Leaderboard</h2>
            <p className="text-pc-text-muted text-xs mt-0.5">
              {filtered.length} player{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter players..."
              className="pc-input pr-8 w-full text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-pc-text-muted hover:text-pc-text text-xs"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-pc-text-muted text-sm animate-pulse">Loading account ELO...</div>
        </div>
      ) : error ? (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl text-center py-12">
          <p className="text-pc-text-muted">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl text-center py-12">
          <p className="text-pc-text-muted">
            {searchQuery ? `No players matching "${searchQuery}".` : "No account ELO data available."}
          </p>
        </div>
      ) : (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border">
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-14">Rank</th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4">Player</th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4">ELO</th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4">Win Rate</th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Matches</th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">Wins</th>
                  <th className="text-center text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">Region</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={`account-elo-${p.playerId}`}
                    className={`border-b border-pc-border/50 hover:bg-pc-bg/60 transition-colors ${i < 3 ? "bg-pc-bg/30" : ""}`}
                  >
                    <td className="py-2.5 px-4">
                      <RankBadge rank={p.rank} />
                    </td>
                    <td className="py-2.5 px-4">
                      <Link href={`/players/${p.playerId}`} className="text-pc-text font-medium hover:text-pc-accent transition-colors">
                        {p.playerName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-right text-pc-accent font-bold">
                      {p.elo.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {p.winRate != null ? (
                        <span className={p.winRate >= 50 ? "text-emerald-400 font-medium" : "text-red-400"}>
                          {p.winRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-pc-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                      {p.totalMatches.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                      {p.totalWins.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded bg-pc-bg text-pc-text-muted">
                        {p.region ?? "—"}
                      </span>
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
