/** player-moderation-directory component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
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
import PlayerDirectoryGrid, { PLAYER_DIRECTORY_CARD_CLASS } from "@/components/player-directory-grid";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";
import PlayersPageHeader from "@/components/ui/players-page-header";
import PlayerDirectorySearch from "@/components/player-directory-search";

type ModerationFilter = "dropperOnly" | "afkWintradeOnly" | "altAccountOnly";
const AUTOMATIC_AFK_PAGE_SIZE = 32;
const COMMUNITY_PAGE_SIZE = 100;

async function fetchAllCommunityPlayers(filter: ModerationFilter, name: string): Promise<CheaterPlayer[]> {
  const players: CheaterPlayer[] = [];
  const seen = new Set<string>();
  for (let offset = 0; ; offset += COMMUNITY_PAGE_SIZE) {
    const page = await fetchCheaterPlayers({
      [filter]: true,
      name: name || undefined,
      limit: COMMUNITY_PAGE_SIZE,
      offset,
    });
    const newPlayers = page.filter((player) => !seen.has(player.id));
    newPlayers.forEach((player) => seen.add(player.id));
    players.push(...newPlayers);
    if (page.length < COMMUNITY_PAGE_SIZE || newPlayers.length === 0) return players;
  }
}

function communityVoteCount(player: CheaterPlayer, filter: ModerationFilter): number {
  return filter === "dropperOnly"
    ? Number(player.dropperVoteCount ?? 0)
    : filter === "afkWintradeOnly"
      ? Number(player.afkWintradeVoteCount ?? 0)
      : Number(player.altAccountVoteCount ?? 0);
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PlayerModerationDirectory({
  titleKey,
  noticeKey,
  emptyKey,
  filter,
  accentClass,
  borderClass,
  noticeClass,
  voteClass,
}: {
  titleKey: TranslationKey;
  noticeKey: TranslationKey;
  emptyKey: TranslationKey;
  filter: ModerationFilter;
  accentClass: string;
  borderClass: string;
  noticeClass: string;
  voteClass: string;
}) {
  const { t, formatNumber } = useLocalization();
  const [players, setPlayers] = useState<CheaterPlayer[]>([]);
  const [automaticPlayers, setAutomaticPlayers] = useState<AutomaticAfkPlayer[]>([]);
  const [automaticPlayerCount, setAutomaticPlayerCount] = useState(0);
  const [automaticPage, setAutomaticPage] = usePersistentDirectoryPage("automaticPage");
  const [communityLoading, setCommunityLoading] = useState(true);
  const [loadedAutomaticKey, setLoadedAutomaticKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const showAutomaticAfk = filter === "afkWintradeOnly";
  const normalizedQuery = query.trim();
  const automaticRequestKey = `${normalizedQuery}:${automaticPage}`;

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setCommunityLoading(true);
      fetchAllCommunityPlayers(filter, normalizedQuery)
        .then((communityRows) => {
          if (active) setPlayers(communityRows);
        })
        .catch(() => {
          if (active) setPlayers([]);
        })
        .finally(() => { if (active) setCommunityLoading(false); });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [filter, normalizedQuery]);

  useEffect(() => {
    if (!showAutomaticAfk) return;

    let active = true;
    fetchAutomaticAfkPlayers({
      name: normalizedQuery || undefined,
      limit: AUTOMATIC_AFK_PAGE_SIZE,
      offset: (automaticPage - 1) * AUTOMATIC_AFK_PAGE_SIZE,
    })
      .then((automaticResult) => {
        if (!active) return;
        setAutomaticPlayers(automaticResult.players);
        setAutomaticPlayerCount(automaticResult.totalCount);
        setLoadedAutomaticKey(automaticRequestKey);
      })
      .catch(() => {
        if (!active) return;
        setAutomaticPlayers([]);
        setAutomaticPlayerCount(0);
        setLoadedAutomaticKey(automaticRequestKey);
      })
    return () => { active = false; };
  }, [automaticPage, automaticRequestKey, normalizedQuery, showAutomaticAfk]);

  const communityDirectory = players.length === 0 ? (
    <div className="py-8 text-center text-sm text-pc-text-secondary">{t(emptyKey)}</div>
  ) : (
    <PlayerDirectoryGrid items={players} getKey={(player) => player.id} loading={communityLoading}>
      {(player) => {
        const voteCount = communityVoteCount(player, filter);
        return <Link href={`/players/${player.id}`} className={`${PLAYER_DIRECTORY_CARD_CLASS} items-center justify-between gap-2 hover:border-pc-accent-mid ${borderClass}`}>
          <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
            <PlayerName
                playerId={player.id}
                cheater={player.cheater}
                susCount={player.susCount}
                dropper={player.dropper}
                dropperVoteCount={player.dropperVoteCount}
                afkWintrade={player.afkWintrade}
                afkWintradeVoteCount={player.afkWintradeVoteCount}
                boosted={player.boosted}
                altAccount={player.altAccount}
                altAccountVoteCount={player.altAccountVoteCount}
              >
                {player.name}
            </PlayerName>
          </div>
          <span className={`w-fit shrink-0 text-xs font-semibold tabular-nums ${voteClass}`}>
            {formatNumber(voteCount)} {voteCount === 1 ? t("moderation.suspiciousVote") : t("moderation.suspiciousVotes")}
          </span>
        </Link>;
      }}
    </PlayerDirectoryGrid>
  );
  const automaticTotalPages = Math.max(1, Math.ceil(automaticPlayerCount / AUTOMATIC_AFK_PAGE_SIZE));
  const automaticLoading = showAutomaticAfk && loadedAutomaticKey !== automaticRequestKey;
  const initialLoading = communityLoading;

  return (
    <div className="space-y-6">
      <PlayersPageHeader title={t(titleKey)} />
      <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${noticeClass}`} role="note">
        {t(noticeKey)}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PlayerDirectorySearch label={t("generated.players.searchByInGameNameOrPlayerId")} value={query} onChange={(value) => { setQuery(value); setAutomaticPage(1); }} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${showAutomaticAfk ? "bg-sky-400" : accentClass}`} />
            <span className="text-xs text-pc-text-muted">{t("moderation.value1CommunityMarked", { value1: formatNumber(players.length) })}</span>
          </span>
          {showAutomaticAfk && <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-xs text-pc-text-muted">{t("moderation.value1AutomaticallyFlaggedPlayers", { value1: formatNumber(automaticPlayerCount) })}</span>
          </span>}
        </div>
      </div>

      {showAutomaticAfk && <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-pc-text-muted">
        <span className="font-semibold text-pc-text-secondary">{t("moderation.afkBadgeLegend")}</span>
        <span className="flex items-center gap-1.5"><span className="rounded border border-red-400/50 bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 font-bold leading-none text-red-300">{t("moderation.afkShort")}</span>{t("moderation.afkAutomaticOnly")}</span>
        <span className="flex items-center gap-1.5"><span className="rounded border border-sky-400/50 bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 font-bold leading-none text-sky-300">{t("moderation.afkShort")}</span>{t("moderation.afkCommunityOnly")}</span>
        <span className="flex items-center gap-1.5"><span className="rounded border border-red-400/50 bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 font-bold leading-none text-sky-300">{t("moderation.afkShort")}</span>{t("moderation.afkAutomaticCommunity")}</span>
      </div>}

      {initialLoading ? (
        <LoadingPanel compact />
      ) : showAutomaticAfk ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold text-pc-text">{t("moderation.automaticallyFlaggedPlayers")}</h2>
            <p className="mt-1 mb-3 text-xs text-pc-text-muted">{t("moderation.automaticAfkDescription")}</p>
            {automaticLoading && automaticPlayers.length === 0 ? (
              <LoadingPanel compact />
            ) : automaticPlayers.length === 0 ? (
              <div className="py-8 text-center text-sm text-pc-text-secondary">{t("moderation.noAutomaticAfk")}</div>
            ) : (
              <div className={`space-y-4 transition-opacity ${automaticLoading ? "opacity-55" : "opacity-100"}`}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {automaticPlayers.map((player) => (
                    <div key={player.id} className="min-w-0">
                      <Link href={`/players/afk-wintrade/${player.id}`} className={`${PLAYER_DIRECTORY_CARD_CLASS} group items-center justify-between gap-2 border-red-400/20 hover:border-red-400/40 hover:bg-red-400/[0.04]`}>
                        <div className="min-w-0 truncate text-sm font-semibold text-pc-text transition-colors group-hover:text-pc-accent">
                          <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount} dropper={player.dropper} dropperVoteCount={player.dropperVoteCount} afkWintrade={player.afkWintrade} afkWintradeVoteCount={player.afkWintradeVoteCount} automaticAfk automaticAfkCount={player.automaticMatchCount} boosted={player.boosted} altAccount={player.altAccount}>{player.name}</PlayerName>
                        </div>
                        <span className="w-fit shrink-0 text-xs font-semibold tabular-nums text-red-100">
                          {formatNumber(player.automaticMatchCount)} {t("generated.players.matches.9f3e924")}
                        </span>
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
