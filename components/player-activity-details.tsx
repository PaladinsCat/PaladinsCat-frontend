"use client";

import Link from "next/link";
import { ExternalLink, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LoadingPanel } from "@/components/async-state";
import {
  fetchPresenceDetails,
  type PresenceDetailMatch,
  type PresenceDetailsResponse,
} from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

const METHODOLOGY_URL =
  "https://github.com/NabiCook/PaladinsCat/blob/main/docs/blog/public-release/how-paladinscat-counts-active-players.md";

function groupPlayersByPlatform(match: PresenceDetailMatch) {
  const groups = new Map<string, PresenceDetailMatch["players"]>();
  for (const player of match.players) {
    const platform = player.platform || "Unknown";
    const existing = groups.get(platform) ?? [];
    existing.push(player);
    groups.set(platform, existing);
  }
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function statusTone(status: string) {
  if (["complete", "complete_direct", "recovered"].includes(status)) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }
  if (["partial_roster", "roster_only", "limited", "broken"].includes(status)) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }
  if (status === "dropped") {
    return "border-rose-400/25 bg-rose-400/10 text-rose-200";
  }
  return "border-pc-border bg-pc-bg-secondary text-pc-text-muted";
}

export default function PlayerActivityDetails() {
  const { t, formatDateTime, formatNumber } = useLocalization();
  const [selectedQueue, setSelectedQueue] = useState<"all" | number>("all");
  const [response, setResponse] = useState<PresenceDetailsResponse | null>(null);
  const [matches, setMatches] = useState<PresenceDetailMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchPresenceDetails({
          queueId: selectedQueue === "all" ? undefined : selectedQueue,
        });
        if (!active) return;
        setResponse(next);
        setMatches(next.matches);
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
  }, [selectedQueue, t]);

  const queues = response?.queues ?? [];
  const visiblePlayers = useMemo(
    () => matches.reduce((sum, match) => sum + match.players.length, 0),
    [matches],
  );

  const loadMore = async () => {
    if (!response?.next_cursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const next = await fetchPresenceDetails({
        queueId: selectedQueue === "all" ? undefined : selectedQueue,
        cursor: response.next_cursor,
      });
      setMatches(current => [...current, ...next.matches]);
      setResponse(next);
    } catch {
      setError(t("playerActivity.detailsLoadError"));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
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
              {t("playerActivity.trackedMatches24h")}
            </div>
            <div className="mt-1 font-mono text-3xl font-bold text-pc-accent">
              {response ? formatNumber(response.total_matches) : "—"}
            </div>
            <p className="mt-1 max-w-2xl text-xs text-pc-text-muted">
              {t("playerActivity.detailsOverlapNote")}
            </p>
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

      {displayLoading ? (
        <LoadingPanel className="min-h-[32rem]" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-pc-text-muted">
            <span>
              {formatNumber(matches.length)} {t("playerActivity.matchesLoaded")}
            </span>
            <span>
              {formatNumber(visiblePlayers)} {t("playerActivity.playerRowsLoaded")}
            </span>
          </div>

          {matches.map(match => {
            const platformGroups = groupPlayersByPlatform(match);
            return (
              <article key={`${match.match_id}:${match.queue_id}`} className="pc-card overflow-hidden">
                <div className="flex flex-wrap items-start gap-3 border-b border-pc-border/50 p-4">
                  <div className="mr-auto">
                    <Link
                      href={`/matches/${match.match_id}`}
                      className="font-mono text-base font-bold text-pc-text transition-colors hover:text-pc-accent"
                    >
                      #{match.match_id}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-pc-text-muted">
                      <span>{match.queue_name} · {match.queue_id}</span>
                      <span>{match.region}</span>
                      <span>{match.map}</span>
                      <time dateTime={match.entry_datetime}>
                        {formatDateTime(match.entry_datetime)}
                      </time>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(match.status)}`}>
                      {match.status.replaceAll("_", " ")}
                    </span>
                    {match.quality !== "unknown" && (
                      <span className="rounded-full border border-pc-border bg-pc-bg-secondary px-2.5 py-1 text-xs text-pc-text-muted">
                        {match.quality}
                      </span>
                    )}
                  </div>
                </div>

                {platformGroups.length > 0 ? (
                  <div className="grid grid-cols-1 divide-y divide-pc-border/40 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    {platformGroups.map(([platform, players]) => (
                      <section key={platform} className="p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-pc-text-muted">
                            {platform}
                          </h2>
                          <span className="font-mono text-xs text-pc-text-muted">{players.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {players.map((player, index) =>
                            Number(player.player_id) > 0 ? (
                              <Link
                                key={`${player.player_id}:${index}`}
                                href={`/players/${player.player_id}`}
                                className="rounded-lg border border-pc-border/60 bg-pc-bg/60 px-2.5 py-1.5 text-xs text-pc-text-secondary transition-colors hover:border-pc-accent/40 hover:text-pc-accent"
                              >
                                {player.player_name}
                              </Link>
                            ) : (
                              <span
                                key={`${player.player_name}:${index}`}
                                className="rounded-lg border border-pc-border/50 bg-pc-bg/40 px-2.5 py-1.5 text-xs text-pc-text-muted"
                              >
                                {player.player_name}
                              </span>
                            ),
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 text-xs text-pc-text-muted">
                    <UsersRound aria-hidden="true" className="h-4 w-4" />
                    <span>{t("playerActivity.noPlayerEvidence")}</span>
                    {match.terminal_reason && (
                      <span className="font-mono text-amber-200">· {match.terminal_reason}</span>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          {matches.length === 0 && !error && (
            <section className="pc-card p-8 text-center text-sm text-pc-text-muted">
              {t("playerActivity.noMatches")}
            </section>
          )}

          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {response?.next_cursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="pc-btn-secondary min-w-32 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore ? t("playerActivity.loadingMoreMatches") : t("playerActivity.loadMoreMatches")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
