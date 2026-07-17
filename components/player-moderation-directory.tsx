"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, type CheaterPlayer } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

type ModerationFilter = "dropperOnly" | "afkWintradeOnly" | "altAccountOnly";

export default function PlayerModerationDirectory({
  titleKey,
  descriptionKey,
  emptyKey,
  filter,
  accentClass,
  borderClass,
}: {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  emptyKey: TranslationKey;
  filter: ModerationFilter;
  accentClass: string;
  borderClass: string;
}) {
  const { t } = useLocalization();
  const [players, setPlayers] = useState<CheaterPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCheaterPlayers({ [filter]: true, limit: 100 })
      .then((rows) => { if (active) setPlayers(rows); })
      .catch(() => { if (active) setPlayers([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t(titleKey)}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t(descriptionKey)}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accentClass}`} />
        <span className="text-xs text-pc-text-muted">{t("moderation.value1CommunityMarked", { value1: players.length.toLocaleString() })}</span>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : players.length === 0 ? (
        <div className="py-12 text-center text-sm text-pc-text-secondary">{t(emptyKey)}</div>
      ) : (
        <PlayerDirectoryGrid items={players} getKey={(player) => player.id}>
          {(player) => (
            <Link href={`/players/${player.id}`} className={`flex min-h-20 h-full items-center justify-between gap-3 rounded-xl border bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent-mid ${borderClass}`}>
              <div className="min-w-0">
                <PlayerName
                  playerId={player.id}
                  cheater={player.cheater}
                  susCount={player.susCount}
                  dropper={player.dropper}
                  afkWintrade={player.afkWintrade}
                  boosted={player.boosted}
                  altAccount={player.altAccount}
                >
                  {player.name}
                </PlayerName>
                <p className="mt-1 text-xs text-pc-text-muted">{player.region} · {player.platform}</p>
              </div>
              <span className="shrink-0 text-pc-text-muted">→</span>
            </Link>
          )}
        </PlayerDirectoryGrid>
      )}
    </div>
  );
}
