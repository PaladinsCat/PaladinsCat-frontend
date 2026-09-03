/** CommunityVoteLeaderboard component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, type CheaterPlayer } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid, { PLAYER_DIRECTORY_CARD_CLASS } from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";
import PlayersPageHeader from "@/components/ui/players-page-header";

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

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
 */
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
    ? "text-violet-300"
    : "text-emerald-300";

  return (
    <div className="space-y-6">
      <PlayersPageHeader title={t(config.titleKey)} />

      {loading ? (
        <LoadingPanel compact />
      ) : players.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.components.noCommunityVotesYet")}</div>
      ) : (
        <PlayerDirectoryGrid
          items={players}
          getKey={(player) => player.id}
          pageSize={32}
          gridClassName="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {(player, index) => (
            <Link
              href={`/players/${player.id}`}
              className={`${PLAYER_DIRECTORY_CARD_CLASS} items-center gap-3 border-pc-border hover:border-pc-accent-mid hover:bg-pc-bg-secondary`}
            >
              <span className="w-6 text-xs text-pc-text-muted">{index + 1}</span>
              <span className="flex-1 min-w-0 text-sm font-medium text-pc-text truncate"><PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount}>{player.name}</PlayerName></span>
              <span className={`shrink-0 text-xs font-semibold tabular-nums ${tone}`}>{config.count(player)} {t("generated.components.votes")}</span>
            </Link>
          )}
        </PlayerDirectoryGrid>
      )}
    </div>
  );
}
