"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, type CheaterPlayer } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";

type VoteKind = "weirdo" | "hall_of_fame";

const CONFIG = {
  weirdo: {
    titleKey: "moderation.weirdoTitle",
    descriptionKey: "moderation.weirdoDescription",
    count: (player: CheaterPlayer) => player.weirdoCount,
    query: { weirdoOnly: true },
    color: "violet",
  },
  hall_of_fame: {
    titleKey: "moderation.hallOfFameTitle",
    descriptionKey: "moderation.hallOfFameDescription",
    count: (player: CheaterPlayer) => player.hallOfFameCount,
    query: { hallOfFameOnly: true },
    color: "emerald",
  },
} as const;

export default function CommunityVoteLeaderboard({ kind }: { kind: VoteKind }) {
  const { t } = useLocalization();
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
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("generated.components.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t(config.titleKey)}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">{t(config.descriptionKey)}</p>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : players.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.components.noCommunityVotesYet")}</div>
      ) : (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          {players.map((player, index) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-pc-border/50 last:border-0 hover:bg-pc-bg/50 transition-colors"
            >
              <span className="w-6 text-xs text-pc-text-muted">{index + 1}</span>
              <span className="flex-1 min-w-0 text-sm font-medium text-pc-text truncate"><PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount}>{player.name}</PlayerName></span>
              <span className="text-xs text-pc-text-muted shrink-0">{player.totalMatches.toLocaleString()} {t("generated.components.matches")}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded border shrink-0 ${tone}`}>{config.count(player)} {t("generated.components.votes")}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
