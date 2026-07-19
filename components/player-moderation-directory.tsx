"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchAutomaticAfkPlayers,
  fetchCheaterPlayers,
  type AutomaticAfkPlayer,
  type CheaterPlayer,
} from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

type ModerationFilter = "dropperOnly" | "afkWintradeOnly" | "altAccountOnly";
type AfkDirectoryItem =
  | { source: "automatic"; player: AutomaticAfkPlayer }
  | { source: "community"; player: CheaterPlayer };

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
  const { t, formatDateTime, formatNumber } = useLocalization();
  const [players, setPlayers] = useState<CheaterPlayer[]>([]);
  const [automaticPlayers, setAutomaticPlayers] = useState<AutomaticAfkPlayer[]>([]);
  const [automaticPlayerCount, setAutomaticPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const showAutomaticAfk = filter === "afkWintradeOnly";

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchCheaterPlayers({ [filter]: true, limit: 100 }),
      showAutomaticAfk ? fetchAutomaticAfkPlayers() : Promise.resolve({ players: [], totalCount: 0 }),
    ])
      .then(([communityRows, automaticPage]) => {
        if (!active) return;
        setPlayers(communityRows);
        setAutomaticPlayers(automaticPage.players);
        setAutomaticPlayerCount(automaticPage.totalCount);
      })
      .catch(() => {
        if (!active) return;
        setPlayers([]);
        setAutomaticPlayers([]);
        setAutomaticPlayerCount(0);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, showAutomaticAfk]);

  const communityDirectory = players.length === 0 ? (
    <div className="py-8 text-center text-sm text-pc-text-secondary">{t(emptyKey)}</div>
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
  );
  const afkDirectoryItems = useMemo<AfkDirectoryItem[]>(() => {
    const automaticIds = new Set(automaticPlayers.map((player) => player.id));
    return [
      ...automaticPlayers.map((player) => ({ source: "automatic" as const, player })),
      ...players.filter((player) => !automaticIds.has(player.id)).map((player) => ({ source: "community" as const, player })),
    ];
  }, [automaticPlayers, players]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t(titleKey)}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t(descriptionKey)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accentClass}`} />
          <span className="text-xs text-pc-text-muted">{t("moderation.value1CommunityMarked", { value1: formatNumber(players.length) })}</span>
        </span>
        {showAutomaticAfk && <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-xs text-pc-text-muted">{t("moderation.value1AutomaticallyFlaggedPlayers", { value1: formatNumber(automaticPlayerCount) })}</span>
        </span>}
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : showAutomaticAfk ? (
        <section>
          <h2 className="text-sm font-bold text-pc-text">{t("moderation.trackedAfkPlayers")}</h2>
          <p className="mt-1 mb-3 text-xs text-pc-text-muted">{t("moderation.afkSourceDescription")}</p>
          {afkDirectoryItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-pc-text-secondary">{t("moderation.noTrackedAfkPlayers")}</div>
          ) : (
            <PlayerDirectoryGrid items={afkDirectoryItems} getKey={(item) => item.player.id}>
              {(item) => {
                const { player } = item;
                const automatic = item.source === "automatic" ? item.player : null;
                return (
                  <Link href={automatic ? `/players/afk-wintrade/${player.id}` : `/players/${player.id}`} className={`group flex h-full min-h-24 flex-col gap-3 rounded-xl border bg-pc-bg-elevated p-4 transition-colors ${automatic ? "border-red-400/20 hover:border-red-400/40 hover:bg-red-400/[0.04]" : `${borderClass} hover:border-pc-accent-mid`}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 truncate text-sm font-semibold text-pc-text transition-colors group-hover:text-pc-accent">
                        <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount} dropper={player.dropper} afkWintrade={player.afkWintrade} boosted={player.boosted} altAccount={player.altAccount}>{player.name}</PlayerName>
                      </div>
                      {automatic && <span className="shrink-0 rounded-md border border-red-400/25 bg-red-400/10 px-2 py-1 text-xs font-semibold text-red-300">{t("moderation.value1FlaggedMatches", { value1: formatNumber(automatic.automaticMatchCount) })}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                      {player.afkWintrade && <span className="rounded border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-sky-300">{t("moderation.communityMarked")}</span>}
                      {automatic && <span className="rounded border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 text-red-300">{t("moderation.automaticallyFlagged")}</span>}
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-3 text-xs text-pc-text-muted">
                      <span>{player.region} · {player.platform}</span>
                      {automatic && <span className="text-right">{t("moderation.lowestEcpm")} <strong className="font-mono text-red-300">{formatNumber(automatic.lowestEcpm, { maximumFractionDigits: 2 })}</strong><br />{t("generated.players.lastObserved")} {formatDateTime(automatic.lastSeen)}</span>}
                    </div>
                  </Link>
                );
              }}
            </PlayerDirectoryGrid>
          )}
        </section>
      ) : (
        communityDirectory
      )}
    </div>
  );
}
