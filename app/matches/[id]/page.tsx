/**
 * Match Detail Page — /matches/[id]
 *
 * Data orchestration layer only. All rendering delegated to components in
 * `components/match-result/`. This page fetches match, fact, snapshots,
 * and stored profile/rating snapshots, then wires them together.
 *
 * Data sources:
 *   GET /api/matches/:id          → match metadata + players + bans
 *   GET /api/matches/fact/:id     → items, cards, talents per player
 *   GET /api/ratings/snapshots/:id → rating changes (pre/post mu/phi)
 *   The match response embeds the immutable post-ingest profile snapshot.
 *
 * @see C:\PaladinsCat\docs\frontend\match-detail.md
 */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchMatchDetail,
  fetchMatchFact,
  fetchMatchSnapshots,
  type MatchDetailWithBans,
  type MatchFact,
  type MatchFactPlayer,
  type MatchPlayerDetail,
  type RatingSnapshot,
} from "@/lib/api-client";
import { championSlug } from "@/lib/utils";
import {
  MatchResultPlayer,
  type PlayerProfileData,
} from "@/components/match-result/types";
import MatchupSection from "@/components/match-result/matchup-section";
import MatchStatsSection from "@/components/match-result/match-stats-section";
import ItemsLoadoutsSection from "@/components/match-result/items-loadouts-section";
import RatingSnapshots from "@/components/match-result/rating-snapshots";
import BrowserScoreboard from "@/components/match-result/browser-scoreboard";
import { ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { readBrowserResult, removeBrowserResult, writeBrowserResult } from "@/lib/browser-result-cache";
import { getQueueLabel } from "@/lib/queue-labels";
import { LocalizedText, useLocalization } from "@/lib/localization-context";

const MATCH_RESULT_CACHE_TTL_MS = 5 * 60 * 1000;
const MATCH_UI_CACHE_TTL_MS = 30 * 60 * 1000;

type CachedMatchResult = {
  match: MatchDetailWithBans | null;
  fact: MatchFact | null;
  snapshots: RatingSnapshot[];
};

function finiteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function storedProfileForMatch(player: MatchPlayerDetail): PlayerProfileData | null {
  if (Number(player.player_id) <= 0) return null;
  const snapshot = player.profile_snapshot;
  if (!snapshot) return null;

  const globalWins = finiteNumber(snapshot.global_wins);
  const globalLosses = finiteNumber(snapshot.global_losses);
  const globalMatches = globalWins != null && globalLosses != null
    ? globalWins + globalLosses
    : 0;
  const championWins = finiteNumber(snapshot.champion_wins);
  const championLosses = finiteNumber(snapshot.champion_losses);
  const championMatches = championWins != null && championLosses != null
    ? championWins + championLosses
    : null;

  return {
    id: String(player.player_id),
    name: player.player_name,
    level: finiteNumber(snapshot.level),
    platform: snapshot.platform ?? player.platform ?? "",
    region: snapshot.region ?? player.region ?? "",
    kbmTier: finiteNumber(snapshot.kbm_tier),
    kbmPoints: finiteNumber(snapshot.kbm_points),
    kbmRank: finiteNumber(snapshot.kbm_rank),
    queueElo: finiteNumber(snapshot.queue_elo),
    championElo: finiteNumber(snapshot.champion_elo),
    globalWins,
    globalLosses,
    globalWinRate: globalMatches > 0 && globalWins != null
      ? (globalWins / globalMatches) * 100
      : null,
    rankedWins: finiteNumber(snapshot.kbm_wins),
    rankedLosses: finiteNumber(snapshot.kbm_losses),
    capturedAt: snapshot.captured_at,
    snapshotSource: snapshot.source,
    cheater: snapshot.cheater === true,
    susCount: finiteNumber(snapshot.sus_count) ?? 0,
    totalMatches: globalMatches,
    totalWins: globalWins ?? 0,
    winRate: globalMatches > 0 && globalWins != null
      ? (globalWins / globalMatches) * 100
      : null,
    totalPlays: globalMatches,
    topChampions: championMatches != null ? [{
      championName: player.champion_name,
      championId: player.champion_id,
      wins: championWins ?? 0,
      totalPlays: championMatches,
      winRate: championMatches > 0 && championWins != null
        ? (championWins / championMatches) * 100
        : 0,
    }] : [],
  };
}

/* ── Page component ── */

export default function MatchDetailPage() {
  const { t } = useLocalization();
  const params = useParams();
  const matchId = String(params.id || "");

  const [match, setMatch] = useState<MatchDetailWithBans | null>(null);
  const [fact, setFact] = useState<MatchFact | null>(null);
  const [snapshots, setSnapshots] = useState<RatingSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const numericMatchId = parseInt(matchId, 10);
    async function load() {
      setLoading(true);
      setError(null);
      const cacheKey = `paladinscat:match-result:v3:${numericMatchId}`;
      try {
        const cached = reloadKey === 0 ? readBrowserResult<CachedMatchResult>(cacheKey) : null;
        if (cached) {
          setMatch(cached.match);
          setFact(cached.fact);
          setSnapshots(cached.snapshots);
          return;
        }

        // Match detail + fact + snapshots in parallel
        const detailResult = await fetchMatchDetail(numericMatchId);
        if (cancelled) return;
        setMatch(detailResult);

        const [factResult, snapResult] = await Promise.all([
          fetchMatchFact(numericMatchId).catch(() => null),
          fetchMatchSnapshots(numericMatchId).catch(() => []),
        ]);
        if (cancelled) return;
        setFact(factResult);
        setSnapshots(snapResult);

        writeBrowserResult(cacheKey, {
          match: detailResult,
          fact: factResult,
          snapshots: snapResult,
        }, MATCH_RESULT_CACHE_TTL_MS);

      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load match");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [matchId, reloadKey]);

  useEffect(() => {
    if (loading || !match) return;
    const cacheKey = `paladinscat:match-scroll:v1:${matchId}`;
    const navigationLockKey = `${cacheKey}:navigating`;
    const cached = readBrowserResult<{ scrollY: number }>(cacheKey);
    removeBrowserResult(navigationLockKey);
    let frame = 0;
    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    if (cached && Number.isFinite(cached.scrollY)) {
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        window.scrollTo({ top: cached.scrollY, behavior: "auto" });
        // Expanded build rows restore in their own mount effect. Reapply once
        // their additional height has entered layout so the offset is exact.
        restoreTimer = setTimeout(() => window.scrollTo({ top: cached.scrollY, behavior: "auto" }), 150);
      });
    }

    const persistScroll = () => {
      if (readBrowserResult<boolean>(navigationLockKey)) return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        writeBrowserResult(cacheKey, { scrollY: window.scrollY }, MATCH_UI_CACHE_TTL_MS);
      });
    };
    window.addEventListener("scroll", persistScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", persistScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (restoreTimer) clearTimeout(restoreTimer);
    };
  }, [loading, match, matchId]);

  /* ── Derived data ── */

  const queueLabel = match ? getQueueLabel(match.match.queue_id) : "";

  // Keep task-force ordering stable throughout the header, matchup, metrics, and builds.
  // The winner flags provide the visual emphasis without swapping the score columns.
  const team1: MatchPlayerDetail[] = match
    ? match.players.filter((p) => p.task_force === 1)
    : [];
  const team2: MatchPlayerDetail[] = match
    ? match.players.filter((p) => p.task_force === 2)
    : [];

  const winnerTF = match?.match.winning_task_force ?? 0;
  const team1Wins = winnerTF === 1;
  const team2Wins = winnerTF === 2;

  // Fact map by player_id (string keys — API returns string IDs at runtime)
  const factMap = new Map<string, MatchFactPlayer>();
  if (fact) {
    for (const fp of fact.players) {
      factMap.set(String(fp.player_id), fp);
    }
  }

  // Enriched players for matchup cards
  const team1Players: MatchResultPlayer[] = team1.map((p) => ({
    matchData: p,
    factData: factMap.get(String(p.player_id)),
    profileData: storedProfileForMatch(p),
  }));
  const team2Players: MatchResultPlayer[] = team2.map((p) => ({
    matchData: p,
    factData: factMap.get(String(p.player_id)),
    profileData: storedProfileForMatch(p),
  }));

  /* ── Skeleton ── */
  if (loading) {
    return <RouteSkeleton variant="match" />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState title={t("generated.matches.matchDetailsUnavailable")} message={error} onRetry={() => setReloadKey((key) => key + 1)} />
        <Link href="/matches" className="text-pc-accent hover:underline mt-4 inline-block">
          <LocalizedText id="generated.matches.backToMatches" /></Link>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <BrowserScoreboard
        match={match.match}
        queueLabel={queueLabel}
        team1={team1Players}
        team2={team2Players}
        bans={match.bans}
      />

      {/* Loadouts — talent, cards, and purchased items */}
      <ItemsLoadoutsSection
        team1Players={team1}
        team2Players={team2}
        team1Wins={team1Wins}
        team2Wins={team2Wins}
        factMap={factMap}
      />

      {/* Match Stats — in-match performance */}
      <MatchStatsSection
        team1Players={team1}
        team2Players={team2}
        team1Wins={team1Wins}
        team2Wins={team2Wins}
        team1Label="Team 1"
        team2Label="Team 2"
        factMap={factMap}
      />

      {/* Player Matchup — pre-match view */}
      <MatchupSection
        team1={team1Players}
        team2={team2Players}
        team1Wins={team1Wins}
        team2Wins={team2Wins}
        team1Label="Team 1"
        team2Label="Team 2"
      />

      {/* Rating Snapshots */}
      {snapshots.length > 0 && <RatingSnapshots snapshots={snapshots} />}

    </div>
  );
}
