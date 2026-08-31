/**
 * Render the matches page and its data composition.
 * Assemble the page content exposed at this location.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMatchSearch, fetchMatchesOverview, type MatchData, type MatchSearchResult } from "@/lib/api-client";
import { useChampions } from "@/lib/champion-names";
import { useTimeZone } from "@/lib/time-zone-context";
import { formatLocalDateTime } from "@/lib/time-format";
import { AsyncButton, EmptyState, ErrorState } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";
import { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import { useAuth } from "@/lib/auth-context";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { useLocalization } from "@/lib/localization-context";

const RANKED_QUEUE_ID = "486";

/**
 * Render the MatchesPage view for matches page.
 * Return the React tree for the declared inputs and page data.
 */
export default function MatchesPage() {
  const { t , formatNumber} = useLocalization();
  const router = useRouter();
  const { timeZone } = useTimeZone();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { definition: lobbyTier, ready: lobbyTierReady } = useLobbyTier();
  const tierParams = isLoggedIn ? { tierMin: lobbyTier.tierMin, tierMax: lobbyTier.tierMax } : undefined;
  const [matches, setMatches] = useState<MatchSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = usePersistentDirectoryPage();
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [championId, setChampionId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [region, setRegion] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ championId: string; region: string; date: string; hour: string } | null>(null);
  const { champions, loading: championsLoading } = useChampions();
  const perPage = 20;

  const loadMatches = useCallback(async () => {
    if (authLoading || !lobbyTierReady) return;
    setLoading(true);
    setError(null);
    try {
      if (appliedFilters) {
        const result = await fetchMatchSearch({
          championId: appliedFilters.championId || undefined,
          queueId: RANKED_QUEUE_ID,
          region: appliedFilters.region || undefined,
          date: appliedFilters.date || undefined,
          hour: appliedFilters.hour || undefined,
          timeZone,
          page: String(page),
          perPage: String(perPage),
        });
        setMatches(result.data);
        setTotal(result.total);
        setTotalPages(result.page.totalPages);
      } else {
        const recent = (await fetchMatchesOverview(tierParams)).recent.slice(0, perPage);
        setMatches(recent.map((match: MatchData) => ({
          match_id: match.match_id, entry_datetime: match.entry_datetime, map: match.map,
          queue_id: match.queue_id, duration_seconds: match.duration_seconds, region: match.region,
          champion_id: 0, champion_name: "", win_status: "", kills: 0, deaths: 0, assists: 0, player_count: 10,
        })));
        setTotal(recent.length);
        setTotalPages(1);
      }
    } catch {
      setMatches([]);
      setTotal(0);
      setTotalPages(1);
      setError(t("generated.matches.weCouldnTLoadMatchDataRightNowPleaseTry"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, authLoading, isLoggedIn, lobbyTier.tierMax, lobbyTier.tierMin, lobbyTierReady, page, timeZone]);

  useEffect(() => { void loadMatches(); }, [loadMatches]);

  const hasFilters = appliedFilters !== null;
  const reset = () => {
    setMatchId(""); setChampionId(""); setRegion(""); setDate(""); setHour(""); setAppliedFilters(null); setPage(1);
  };

  const search = () => {
    const requestedMatchId = matchId.trim();
    if (requestedMatchId) {
      if (!/^\d+$/.test(requestedMatchId) || /^0+$/.test(requestedMatchId)) {
        setError(t("matches.invalidMatchId"));
        return;
      }
      router.push(`/matches/${requestedMatchId}`);
      return;
    }
    setAppliedFilters({ championId, region, date, hour });
    setPage(1);
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.matches.matches")}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t("matches.description")}</p>
      </div>
      <Link href="/matches/dropped" className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs text-pc-text-secondary transition-colors hover:border-pc-accent-mid hover:text-pc-accent">
        {t("matches.dropped.link")}
      </Link>
    </header>

    <section className="pc-card">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs text-pc-text-muted">{t("generated.matches.matchId")}<input value={matchId} onChange={(event) => setMatchId(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); search(); } }} inputMode="numeric" pattern="[0-9]*" placeholder={t("matches.matchIdPlaceholder")} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-1.5 text-sm text-pc-text" /></label>
        <label className="text-xs text-pc-text-muted">{t("generated.matches.champion")}<select value={championId} onChange={(event) => setChampionId(event.target.value)} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-1.5 text-sm text-pc-text" disabled={championsLoading}><option value="">{t("generated.matches.all")}</option>{champions?.sort((a, b) => a.name.localeCompare(b.name)).map((champion) => <option key={champion.id} value={String(champion.id)}>{champion.name}</option>)}</select></label>
        <label className="text-xs text-pc-text-muted">{t("generated.matches.region")}<select value={region} onChange={(event) => setRegion(event.target.value)} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-1.5 text-sm text-pc-text"><option value="">{t("generated.matches.all")}</option><option value="NA">{t("generated.matches.na")}</option><option value="EU">{t("generated.matches.eu")}</option></select></label>
        <label className="text-xs text-pc-text-muted">{t("generated.matches.date")}{timeZone})<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-1.5 text-sm text-pc-text" /></label>
        <label className="text-xs text-pc-text-muted">{t("generated.matches.hour")}{timeZone})<select value={hour} onChange={(event) => setHour(event.target.value)} disabled={!date} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-1.5 text-sm text-pc-text disabled:opacity-50"><option value="">{t("generated.matches.allHours")}</option>{Array.from({ length: 24 }, (_, value) => <option key={value} value={String(value)}>{String(value).padStart(2, "0")}:00 – {String(value).padStart(2, "0")}:59</option>)}</select></label>
      </div>
      <div className="mt-3 flex gap-2"><AsyncButton onClick={search} loading={loading} className="flex-1 rounded-lg bg-pc-accent px-4 py-1.5 text-sm font-semibold text-pc-bg">{t("generated.matches.search")}</AsyncButton><button onClick={reset} className="rounded-lg border border-pc-border bg-pc-bg px-4 py-1.5 text-sm text-pc-text-secondary hover:bg-pc-bg-elevated">{t("generated.matches.reset")}</button></div>
    </section>

    {loading && <DataTableSkeleton rows={8} />}
    {error && !loading && <ErrorState message={error} onRetry={() => void loadMatches()} />}
    {!loading && !error && matches.length === 0 && <EmptyState title={hasFilters ? t("generated.matches.noMatchingGames") : t("generated.matches.noRankedMatchesAvailable")} description={hasFilters ? t("common.empty.matchesFiltered") : t("common.empty.matchesNew")} />}
    {!loading && !error && matches.length > 0 && <>
      {hasFilters && <div className="text-xs text-pc-text-muted">{t("generated.matches.showing")} {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} {t("generated.matches.of")} {formatNumber(total)} {t("generated.matches.rankedMatches")}</div>}
      <div className="space-y-2 sm:hidden">{matches.map((match) => <MatchCard key={match.match_id} match={match} />)}</div>
      <div className="hidden overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated sm:block"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-pc-border bg-pc-bg-secondary text-left text-xs text-pc-text-muted"><th className="px-4 py-3">{t("generated.matches.matchId")}</th><th className="px-4 py-3">{t("generated.matches.map")}</th><th className="px-4 py-3">{t("generated.matches.region")}</th><th className="px-4 py-3">{t("generated.matches.duration")}</th><th className="px-4 py-3">{t("generated.matches.date.eb9a4bc")}</th></tr></thead><tbody>{matches.map((match) => <MatchRow key={match.match_id} match={match} />)}</tbody></table></div></div>
      {hasFilters && totalPages > 1 && <div className="flex items-center justify-center gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs text-pc-text disabled:opacity-50">{t("generated.matches.prev")}</button><span className="px-4 text-xs text-pc-text-secondary">{t("generated.matches.page")} {page} {t("generated.matches.of")} {totalPages}</span><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs text-pc-text disabled:opacity-50">{t("generated.matches.next")}</button></div>}
    </>}
  </div>;
}

function MatchRow({ match }: { match: MatchSearchResult }) {
  const href = `/matches/${match.match_id}`;
  return <tr className="group border-b border-pc-border/50 hover:bg-pc-bg-secondary"><td className="px-4 py-3"><Link href={href} className="text-xs font-medium text-pc-accent">#{match.match_id}</Link></td><td className="px-4 py-3 text-xs text-pc-text-secondary"><Link href={href}>{match.map}</Link></td><td className="px-4 py-3 text-xs text-pc-text-secondary"><Link href={href}>{match.region}</Link></td><td className="px-4 py-3 text-xs text-pc-text-secondary"><Link href={href}>{formatDuration(match.duration_seconds)}</Link></td><td className="px-4 py-3 text-xs text-pc-text-secondary"><Link href={href}>{formatLocalDateTime(match.entry_datetime)}</Link></td></tr>;
}

function MatchCard({ match }: { match: MatchSearchResult }) {
  const { t , formatDateTime} = useLocalization();
  const href = `/matches/${match.match_id}`;
  return <Link href={href} className="pc-mobile-panel block p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold text-pc-text">{match.map || t("generated.matches.unknownMap")}</div><div className="mt-0.5 font-mono text-xs text-pc-accent">#{match.match_id}</div></div><span className="rounded-full border border-pc-border bg-pc-bg px-2 py-1 text-xs uppercase text-pc-text-secondary">{match.region || "—"}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.matches.duration")}</div><div className="font-mono text-pc-text-secondary">{formatDuration(match.duration_seconds)}</div></div><div className="text-right"><div className="text-xs uppercase text-pc-text-muted">{t("generated.matches.played")}</div><div className="text-pc-text-secondary">{formatDateTime(match.entry_datetime)}</div></div></div></Link>;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
