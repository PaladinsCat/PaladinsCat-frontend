"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingPanel } from "@/components/async-state";
import {
  fetchPresenceMatchIds,
  fetchPresencePlayers,
  type PresenceMatchIdsResponse,
  type PresencePlayersResponse,
} from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

const METHODOLOGY_URL =
  "https://github.com/NabiCook/PaladinsCat/blob/main/docs/blog/public-release/how-paladinscat-counts-active-players.md";

type EvidenceTab = "matches" | "players";

export default function PlayerActivityDetails() {
  const { t, formatNumber } = useLocalization();
  const [activeTab, setActiveTab] = useState<EvidenceTab>("matches");
  const [selectedQueue, setSelectedQueue] = useState<"all" | number>("all");
  const [matchResponse, setMatchResponse] = useState<PresenceMatchIdsResponse | null>(null);
  const [playerResponse, setPlayerResponse] = useState<PresencePlayersResponse | null>(null);
  const [matchIds, setMatchIds] = useState<PresenceMatchIdsResponse["match_ids"]>([]);
  const [players, setPlayers] = useState<PresencePlayersResponse["players"]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    let active = true;
    const queueId = selectedQueue === "all" ? undefined : selectedQueue;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "matches") {
          const next = await fetchPresenceMatchIds({ queueId });
          if (!active) return;
          setMatchResponse(next);
          setMatchIds(next.match_ids);
        } else {
          const next = await fetchPresencePlayers({ queueId });
          if (!active) return;
          setPlayerResponse(next);
          setPlayers(next.players);
        }
      } catch {
        if (active) setError(t("playerActivity.detailsLoadError"));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [activeTab, selectedQueue, t]);

  const loadMore = async () => {
    if (loadingMore) return;
    const queueId = selectedQueue === "all" ? undefined : selectedQueue;
    setLoadingMore(true);
    setError(null);
    try {
      if (activeTab === "matches" && matchResponse?.next_cursor) {
        const next = await fetchPresenceMatchIds({
          queueId,
          cursor: matchResponse.next_cursor,
        });
        setMatchIds(current => [...current, ...next.match_ids]);
        setMatchResponse(next);
      } else if (activeTab === "players" && playerResponse?.next_cursor) {
        const next = await fetchPresencePlayers({
          queueId,
          cursor: playerResponse.next_cursor,
        });
        setPlayers(current => [...current, ...next.players]);
        setPlayerResponse(next);
      }
    } catch {
      setError(t("playerActivity.detailsLoadError"));
    } finally {
      setLoadingMore(false);
    }
  };

  const queues = matchResponse?.queues ?? [];
  const total = activeTab === "matches"
    ? matchResponse?.total_matches
    : playerResponse?.total_players;
  const nextCursor = activeTab === "matches"
    ? matchResponse?.next_cursor
    : playerResponse?.next_cursor;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">
            {t("playerActivity.detailsTitle")}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-pc-text-secondary">
            {t("playerActivity.detailsDescription")}
          </p>
        </div>
        <a
          href={METHODOLOGY_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-pc-accent transition-colors hover:text-pc-accent-light"
        >
          {t("playerActivity.readMethodology")}
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </header>

      <section className="pc-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="mr-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-pc-text-muted">
              {activeTab === "matches"
                ? t("playerActivity.trackedMatches24h")
                : t("playerActivity.trackedPlayers24h")}
            </div>
            <div className="mt-1 font-mono text-3xl font-bold text-pc-accent">
              {total == null ? "—" : formatNumber(total)}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-pc-text-secondary">
            {t("playerActivity.queue")}
            <select
              value={selectedQueue}
              onChange={event =>
                setSelectedQueue(event.target.value === "all" ? "all" : Number(event.target.value))
              }
              className="rounded-lg border border-pc-border bg-pc-bg px-2.5 py-1.5 text-xs text-pc-text"
            >
              <option value="all">{t("playerActivity.allQueues")}</option>
              {queues.map(queue => (
                <option key={queue.queue_id} value={queue.queue_id}>
                  {queue.queue_name} ({formatNumber(queue.matches)})
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div
        role="tablist"
        aria-label={t("playerActivity.evidenceTabs")}
        className="flex border-b border-pc-border"
      >
        {(["matches", "players"] as const).map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "border-pc-accent text-pc-accent"
                : "border-transparent text-pc-text-muted hover:text-pc-text"
            }`}
          >
            {tab === "matches"
              ? t("playerActivity.matchesTab")
              : t("playerActivity.playersTab")}
          </button>
        ))}
      </div>

      {displayLoading ? (
        <LoadingPanel className="min-h-[24rem]" />
      ) : (
        <div className="space-y-5">
          {activeTab === "matches" ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2 border-y border-pc-border/60 py-4 font-mono text-sm">
              {matchIds.map(match => (
                <li key={`${match.match_id}:${match.queue_id}`}>
                  <Link
                    href={`/matches/${match.match_id}`}
                    className="text-pc-text-secondary transition-colors hover:text-pc-accent"
                  >
                    {match.match_id}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-pc-border/60 py-4 text-sm">
              {players.map(player => (
                <Link
                  key={player.player_id}
                  href={`/players/${player.player_id}`}
                  className="text-pc-text-secondary transition-colors hover:text-pc-accent"
                >
                  {player.player_name}
                </Link>
              ))}
            </div>
          )}

          {activeTab === "matches" && matchIds.length === 0 && !error && (
            <p className="py-8 text-center text-sm text-pc-text-muted">
              {t("playerActivity.noMatches")}
            </p>
          )}
          {activeTab === "players" && players.length === 0 && !error && (
            <p className="py-8 text-center text-sm text-pc-text-muted">
              {t("playerActivity.noPlayers")}
            </p>
          )}

          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {nextCursor && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="pc-btn-secondary min-w-32 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore
                  ? t("playerActivity.loadingMoreEvidence")
                  : t("playerActivity.loadMoreEvidence")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
