"use client";

import { useEffect, useState } from "react";
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
import PlayerDirectoryPagination from "@/components/player-directory-pagination";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

type ModerationFilter = "dropperOnly" | "afkWintradeOnly" | "altAccountOnly";
const AUTOMATIC_AFK_PAGE_SIZE = 24;

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
  const [automaticPage, setAutomaticPage] = useState(1);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [loadedAutomaticPage, setLoadedAutomaticPage] = useState<number | null>(null);
  const showAutomaticAfk = filter === "afkWintradeOnly";

  useEffect(() => {
    let active = true;
    fetchCheaterPlayers({ [filter]: true, limit: 100 })
      .then((communityRows) => {
        if (!active) return;
        setPlayers(communityRows);
      })
      .catch(() => {
        if (!active) return;
        setPlayers([]);
      })
      .finally(() => { if (active) setCommunityLoading(false); });
    return () => { active = false; };
  }, [filter]);

  useEffect(() => {
    if (!showAutomaticAfk) return;

    let active = true;
    fetchAutomaticAfkPlayers({
      limit: AUTOMATIC_AFK_PAGE_SIZE,
      offset: (automaticPage - 1) * AUTOMATIC_AFK_PAGE_SIZE,
    })
      .then((automaticResult) => {
        if (!active) return;
        setAutomaticPlayers(automaticResult.players);
        setAutomaticPlayerCount(automaticResult.totalCount);
        setLoadedAutomaticPage(automaticPage);
      })
      .catch(() => {
        if (!active) return;
        setAutomaticPlayers([]);
        setAutomaticPlayerCount(0);
        setLoadedAutomaticPage(automaticPage);
      })
    return () => { active = false; };
  }, [automaticPage, showAutomaticAfk]);

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
  const automaticTotalPages = Math.max(1, Math.ceil(automaticPlayerCount / AUTOMATIC_AFK_PAGE_SIZE));
  const automaticLoading = showAutomaticAfk && loadedAutomaticPage !== automaticPage;
  const initialLoading = communityLoading || (showAutomaticAfk && automaticLoading && automaticPlayers.length === 0);

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

      {initialLoading ? (
        <LoadingPanel compact />
      ) : showAutomaticAfk ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold text-pc-text">{t("moderation.automaticallyFlaggedPlayers")}</h2>
            <p className="mt-1 mb-3 text-xs text-pc-text-muted">{t("moderation.automaticAfkDescription")}</p>
            {automaticPlayers.length === 0 ? (
              <div className="py-8 text-center text-sm text-pc-text-secondary">{t("moderation.noAutomaticAfk")}</div>
            ) : (
              <div className={`space-y-4 transition-opacity ${automaticLoading ? "opacity-55" : "opacity-100"}`}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {automaticPlayers.map((player) => (
                    <div key={player.id} className="min-w-0">
                      <Link href={`/players/afk-wintrade/${player.id}`} className="group flex h-full min-h-24 flex-col gap-3 rounded-xl border border-red-400/20 bg-pc-bg-elevated p-4 transition-colors hover:border-red-400/40 hover:bg-red-400/[0.04]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 truncate text-sm font-semibold text-pc-text transition-colors group-hover:text-pc-accent">
                            <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount} dropper={player.dropper} afkWintrade={player.afkWintrade} boosted={player.boosted} altAccount={player.altAccount}>{player.name}</PlayerName>
                          </div>
                          <span className="shrink-0 rounded-md border border-red-400/25 bg-red-400/10 px-2 py-1 text-xs font-semibold text-red-300">{t("moderation.value1LowActivityMatches", { value1: formatNumber(player.automaticMatchCount) })}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                          {player.afkWintrade && <span className="rounded border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-sky-300">{t("moderation.communityMarked")}</span>}
                          <span className="rounded border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 text-red-300">{t("moderation.automaticallyFlagged")}</span>
                        </div>
                        <div className="mt-auto flex items-end justify-between gap-3 text-xs text-pc-text-muted">
                          <span>{player.region} · {player.platform}</span>
                          <span className="text-right">{t("moderation.lowestEcpm")} <strong className="font-mono text-red-300">{formatNumber(player.lowestEcpm, { maximumFractionDigits: 2 })}</strong><br />{t("generated.players.lastObserved")} {formatDateTime(player.lastSeen)}</span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                <PlayerDirectoryPagination page={automaticPage} totalPages={automaticTotalPages} onPageChange={setAutomaticPage} />
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-bold text-pc-text">{t("moderation.communityMarkedAccountsTitle")}</h2>
            <p className="mt-1 mb-3 text-xs text-pc-text-muted">{t("moderation.communityMarkedAfkDescription")}</p>
            {communityDirectory}
          </section>
        </div>
      ) : (
        communityDirectory
      )}
    </div>
  );
}
