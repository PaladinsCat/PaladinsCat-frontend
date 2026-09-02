/**
 * Render the matches page and its data composition.
 * Assemble the page content exposed at this location.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { fetchMatchSearch, fetchMatchesOverview, type MatchData, type MatchSearchResult } from "@/lib/api-client";
import { useChampions } from "@/lib/champion-names";
import { useTimeZone } from "@/lib/time-zone-context";
import { AsyncButton, ContentFade, EmptyState, ErrorState } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import { useAuth } from "@/lib/auth-context";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { useLocalization } from "@/lib/localization-context";
import MatchDirectoryList from "@/components/match-directory-list";

const RANKED_QUEUE_ID = "486";

/**
 * Render the MatchesPage view for matches page.
 * Return the React tree for the declared inputs and page data.
 * Returns: `React.JSX.Element`
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
    <header>
      <h1 className="pc-heading pc-heading-lg">{t("generated.matches.matches")}</h1>
    </header>

    <section className="space-y-4" aria-label={t("generated.matches.search")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs text-pc-text-secondary">{t("generated.matches.matchId")}<input value={matchId} onChange={(event) => setMatchId(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); search(); } }} inputMode="numeric" pattern="[0-9]*" placeholder={t("matches.matchIdPlaceholder")} className="pc-input mt-1.5" /></label>
        <label className="text-xs text-pc-text-secondary">{t("generated.matches.champion")}<select value={championId} onChange={(event) => setChampionId(event.target.value)} className="pc-select mt-1.5 w-full" disabled={championsLoading}><option value="">{t("generated.matches.all")}</option>{champions?.sort((a, b) => a.name.localeCompare(b.name)).map((champion) => <option key={champion.id} value={String(champion.id)}>{champion.name}</option>)}</select></label>
        <label className="text-xs text-pc-text-secondary">{t("generated.matches.region")}<select value={region} onChange={(event) => setRegion(event.target.value)} className="pc-select mt-1.5 w-full"><option value="">{t("generated.matches.all")}</option><option value="NA">{t("generated.matches.na")}</option><option value="EU">{t("generated.matches.eu")}</option></select></label>
        <label className="text-xs text-pc-text-secondary">{t("generated.matches.date")}{timeZone})<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="pc-input mt-1.5" /></label>
        <label className="text-xs text-pc-text-secondary">{t("generated.matches.hour")}{timeZone})<select value={hour} onChange={(event) => setHour(event.target.value)} disabled={!date} className="pc-select mt-1.5 w-full disabled:cursor-not-allowed disabled:opacity-50"><option value="">{t("generated.matches.allHours")}</option>{Array.from({ length: 24 }, (_, value) => <option key={value} value={String(value)}>{String(value).padStart(2, "0")}:00 – {String(value).padStart(2, "0")}:59</option>)}</select></label>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={reset} className="pc-btn-secondary gap-2"><RotateCcw aria-hidden="true" className="h-4 w-4" />{t("generated.matches.reset")}</button>
        <AsyncButton type="button" onClick={search} loading={loading} className="pc-btn-primary min-w-28 gap-2 [&_svg]:text-pc-bg"><Search aria-hidden="true" className="h-4 w-4" />{t("generated.matches.search")}</AsyncButton>
      </div>
    </section>

    {loading && <DataTableSkeleton rows={8} />}
    {error && !loading && <ErrorState message={error} onRetry={() => void loadMatches()} />}
    {!loading && !error && matches.length === 0 && <EmptyState title={hasFilters ? t("generated.matches.noMatchingGames") : t("generated.matches.noRankedMatchesAvailable")} description={hasFilters ? t("common.empty.matchesFiltered") : t("common.empty.matchesNew")} />}
    {!loading && !error && matches.length > 0 && <ContentFade className="space-y-3">
      <div className="pc-section-heading px-1">
        <h2 className="text-sm font-semibold text-pc-text">{t("generated.matches.rankedMatches")}</h2>
        <span className="text-xs tabular-nums text-pc-text-muted">{hasFilters ? <>{t("generated.matches.showing")} {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} {t("generated.matches.of")} {formatNumber(total)}</> : <>{formatNumber(total)} {t("generated.matches.rankedMatches")}</>}</span>
      </div>
      <MatchDirectoryList
        matches={matches}
        mobileFooter={hasFilters ? <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} className="flex sm:hidden" /> : null}
        desktopFooter={hasFilters ? <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} embedded className="hidden sm:flex" /> : null}
      />
    </ContentFade>}
  </div>;
}
