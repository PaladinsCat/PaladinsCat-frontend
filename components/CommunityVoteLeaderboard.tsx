"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, type CheaterPlayer } from "@/lib/api-client";

type VoteKind = "weirdo" | "hall_of_fame";

const CONFIG = {
  weirdo: {
    title: "Weirdo",
    description: "Players the community has marked as delightfully unusual.",
    count: (player: CheaterPlayer) => player.weirdoCount,
    query: { weirdoOnly: true },
    color: "violet",
  },
  hall_of_fame: {
    title: "Hall of Fame",
    description: "Players the community wants to celebrate.",
    count: (player: CheaterPlayer) => player.hallOfFameCount,
    query: { hallOfFameOnly: true },
    color: "emerald",
  },
} as const;

export default function CommunityVoteLeaderboard({ kind }: { kind: VoteKind }) {
  const config = CONFIG[kind];
  const [players, setPlayers] = useState<CheaterPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheaterPlayers({ ...config.query, limit: 100 })
      .then(setPlayers)
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [config]);

  const tone = config.color === "violet"
    ? "border-violet-500/20 text-violet-300 bg-violet-500/10"
    : "border-emerald-500/20 text-emerald-300 bg-emerald-500/10";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">← Players</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{config.title}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">{config.description}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">Loading...</div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">No community votes yet.</div>
      ) : (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          {players.map((player, index) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-pc-border/50 last:border-0 hover:bg-pc-bg/50 transition-colors"
            >
              <span className="w-6 text-xs text-pc-text-muted">{index + 1}</span>
              <span className="flex-1 min-w-0 text-sm font-medium text-pc-text truncate">{player.name}</span>
              <span className="text-xs text-pc-text-muted shrink-0">{player.totalMatches.toLocaleString()} matches</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded border shrink-0 ${tone}`}>{config.count(player)} votes</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
