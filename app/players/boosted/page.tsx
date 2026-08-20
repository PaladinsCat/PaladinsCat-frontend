"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { fetchBoostedPlayerDetail, fetchBoostedPlayers, fetchCheaterPlayers, type BoostedPlayer } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";

const FETCH_PAGE_SIZE = 100;

function matchesBoostedQuery(player: BoostedPlayer, query: string): boolean {
  const normalizedQuery = query.trim();
  return /^\d+$/.test(normalizedQuery)
    ? player.id === normalizedQuery
    : player.name.toLocaleLowerCase().includes(normalizedQuery.toLocaleLowerCase());
}

async function fetchBoostedPages(name: string | undefined, initialPage?: BoostedPlayer[]): Promise<BoostedPlayer[]> {
  const players: BoostedPlayer[] = [];
  const seen = new Set<string>();
  for (let offset = 0; ; offset += FETCH_PAGE_SIZE) {
    const page = initialPage && offset === 0 ? initialPage : await fetchBoostedPlayers({
      name,
      limit: FETCH_PAGE_SIZE,
      offset,
    });
    const newPlayers = page.filter((player) => !seen.has(player.id));
    newPlayers.forEach((player) => seen.add(player.id));
    players.push(...newPlayers);
    if (page.length < FETCH_PAGE_SIZE || newPlayers.length === 0) return players;
  }
}

async function fetchAllBoostedPlayers(name: string): Promise<BoostedPlayer[]> {
  const normalizedQuery = name.trim();
  const firstPage = await fetchBoostedPlayers({
    name: normalizedQuery || undefined,
    limit: FETCH_PAGE_SIZE,
  });
  if (!normalizedQuery || firstPage.every((player) => matchesBoostedQuery(player, normalizedQuery))) {
    return fetchBoostedPages(normalizedQuery || undefined, firstPage);
  }

  // Keep search usable against an older API while the server-side boosted
  // directory search rolls out. The standard directory already exposes the
  // boosted flag; details restore the boosted-specific evidence for cards.
  const candidates = await fetchCheaterPlayers({ name: normalizedQuery, limit: FETCH_PAGE_SIZE });
  const details = await Promise.allSettled(
    candidates
      .filter((player) => player.boosted)
      .map((player) => fetchBoostedPlayerDetail(player.id)),
  );
  return details.flatMap((detail) => detail.status === "fulfilled" ? [detail.value.player] : []);
}

export default function BoostedPlayersPage() {
  const { t , formatNumber} = useLocalization();
  const [players, setPlayers] = useState<BoostedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchAllBoostedPlayers(query.trim())
        .then((rows) => {
          if (active) setPlayers(rows);
        })
        .catch(() => {
          if (active) setPlayers([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("moderation.boostedPlayers")}</h1>
        <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm font-medium text-orange-50 backdrop-blur-md" role="note">
          {t("moderation.boostedThresholdNotice")}
        </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">{t("generated.players.searchByInGameNameOrPlayerId")}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("generated.players.searchByInGameNameOrPlayerId")}
            className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid"
          />
        </label>
        <span className="flex items-center gap-2 text-xs text-pc-text-muted">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          {formatNumber(players.length)} {t("moderation.boosted")}
        </span>
      </div>

      {loading && players.length === 0 ? (
        <LoadingPanel compact />
      ) : players.length === 0 ? (
        <div className="py-12 text-center text-sm text-pc-text-secondary">{t("moderation.noBoostedPlayers")}</div>
      ) : (
        <PlayerDirectoryGrid items={players} getKey={(player) => player.id} loading={loading}>
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
