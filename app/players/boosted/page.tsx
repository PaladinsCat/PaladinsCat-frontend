"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchBoostedPlayers, type BoostedPlayer } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";

export default function BoostedPlayersPage() {
  const { t , formatNumber} = useLocalization();
  const [players, setPlayers] = useState<BoostedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoostedPlayers()
      .then(setPlayers)
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("moderation.boostedPlayers")}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t("moderation.boostedDescription")}</p>

      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-orange-400" />
        <span className="text-xs text-pc-text-muted">{players.length} {t("moderation.boosted")}</span>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : players.length === 0 ? (
        <div className="py-12 text-center text-sm text-pc-text-secondary">{t("moderation.noBoostedPlayers")}</div>
      ) : (
        <PlayerDirectoryGrid items={players} getKey={(player) => player.id}>
          {(player) => (
            <Link
              href={`/players/boosted/${player.id}`}
              className="group flex h-full min-h-24 flex-col gap-3 rounded-xl border border-orange-400/20 bg-pc-bg-elevated p-4 transition-colors hover:border-orange-400/40 hover:bg-orange-400/[0.04]"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-pc-text transition-colors group-hover:text-pc-accent">
                  <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount} boosted={player.boosted}>{player.name}</PlayerName>
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-pc-text-muted">{t("moderation.cheaterDuo")}</div>
                <ul className="flex flex-wrap gap-1.5">
                  {player.cheaters.map((cheater) => (
                    <li key={cheater.id} className="max-w-full rounded-md border border-red-500/20 bg-[var(--pc-bg-secondary)] px-2 py-1 text-xs leading-relaxed text-red-200 [overflow-wrap:anywhere]">
                      <span className="font-semibold">{cheater.name}</span>
                      <span className="ml-1 text-red-200/70">· {formatNumber(cheater.matchCount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          )}
        </PlayerDirectoryGrid>
      )}
    </div>
  );
}
