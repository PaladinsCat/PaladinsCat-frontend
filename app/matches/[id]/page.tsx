/**
 * Match Detail Page — /matches/[id]
 *
 * Data orchestration layer only. All rendering delegated to components in
 * `components/match-result/`. This page fetches match, fact, snapshots,
 * related matches, and player profiles, then wires them together.
 *
 * Data sources:
 *   GET /api/matches/:id          → match metadata + players + bans
 *   GET /api/matches/fact/:id     → items, cards, talents per player
 *   GET /api/ratings/snapshots/:id → rating changes (pre/post mu/phi)
 *   GET /api/players/:id          → lifetime stats per player (profile)
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
  fetchPlayerProfile,
  type MatchDetailWithBans,
  type MatchFact,
  type MatchFactPlayer,
  type MatchPlayerDetail,
  type RatingSnapshot,
  type MatchBan,
} from "@/lib/api-client";
import { formatLocalDateTime } from "@/lib/time-format";
import { championSlug } from "@/lib/utils";
import {
  MatchResultPlayer,
  ProfileByPlayerId,
} from "@/components/match-result/types";
import MatchHeader from "@/components/match-result/match-header";
import BansSection from "@/components/match-result/bans-section";
import MatchupSection from "@/components/match-result/matchup-section";
import MatchStatsSection from "@/components/match-result/match-stats-section";
import ItemsLoadoutsSection from "@/components/match-result/items-loadouts-section";
import RatingSnapshots from "@/components/match-result/rating-snapshots";
import MatchExportButton from "@/components/match-result/match-export-button";
import { ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";

/* ── Helpers ── */

function queueName(id: number): string {
  const map: Record<number, string> = {
    1: "Casual Queue", 2: "KBM", 4: "1v1", 8: "Team Queue",
    16: "Open", 32: "Doomspire",
  };
  return map[id] ?? `Queue #${id}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Profile fetching with Promise.allSettled + dedupe + timeout ── */

async function fetchProfilesForMatch(
  players: MatchPlayerDetail[],
  queueId: number,
): Promise<ProfileByPlayerId> {
  const uniquePlayers = [...new Map(players.map((player) => [String(player.player_id), player])).values()];
  // Each profile fetch gets its own 10-second timeout
  const timedFetch = (player: MatchPlayerDetail) =>
    fetchPlayerProfile(String(player.player_id), queueId, player.champion_id)
      .catch(() => null);

  const results = await Promise.allSettled(
    uniquePlayers.map((player) => timedFetch(player)),
  );
  const map = new Map<string, any>();
  for (let i = 0; i < uniquePlayers.length; i++) {
    const r = results[i] as PromiseSettledResult<any>;
    if (r.status === "fulfilled" && r.value) {
      map.set(String(uniquePlayers[i].player_id), r.value);
    }
  }
  return map;
}

/* ── Page component ── */

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = String(params.id || "");

  const [match, setMatch] = useState<MatchDetailWithBans | null>(null);
  const [fact, setFact] = useState<MatchFact | null>(null);
  const [snapshots, setSnapshots] = useState<RatingSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileMap, setProfileMap] = useState<ProfileByPlayerId | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const numericMatchId = parseInt(matchId, 10);
    async function load() {
      setLoading(true);
      setError(null);
      try {
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

        // Fetch player profiles in parallel (optional — page renders without them)
        if (detailResult?.players) {
          const profiles = await fetchProfilesForMatch(detailResult.players, detailResult.match.queue_id);
          if (!cancelled) setProfileMap(profiles);
        }

      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load match");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [matchId, reloadKey]);

  /* ── Derived data ── */

  const queueLabel = match ? queueName(match.match.queue_id) : "";
  const isRanked = match?.match.is_ranked ?? false;
  const duration = match ? formatDuration(match.match.duration_seconds) : "";
  const timestamp = match ? formatLocalDateTime(match.match.entry_datetime) : "";

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

  // Resolved bans
  const resolvedBans = match?.bans.map((ban) => ({
    banSlot: ban.ban_slot ?? 0,
    championId: ban.champion_id,
    championName: ban.champion_name || null,
  })) ?? [];

  // Enriched players for matchup cards
  const team1Players: MatchResultPlayer[] = team1.map((p) => ({
    matchData: p,
    factData: factMap.get(String(p.player_id)),
    profileData: profileMap?.get(String(p.player_id)) ?? null,
  }));
  const team2Players: MatchResultPlayer[] = team2.map((p) => ({
    matchData: p,
    factData: factMap.get(String(p.player_id)),
    profileData: profileMap?.get(String(p.player_id)) ?? null,
  }));

  /* ── Skeleton ── */
  if (loading) {
    return <RouteSkeleton variant="match" />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState title="Match details unavailable" message={error} onRetry={() => setReloadKey((key) => key + 1)} />
        <Link href="/matches" className="text-pc-accent hover:underline mt-4 inline-block">
          ← Back to matches
        </Link>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header — match metadata, scores, flags */}
      <MatchHeader
        matchId={match.match.match_id}
        queueLabel={queueLabel}
        isRanked={isRanked}
        map={match.match.map}
        duration={duration}
        timestamp={timestamp}
        region={match.match.region}
        team1Wins={team1Wins}
        team2Wins={team2Wins}
        team1Score={match.match.team1_score}
        team2Score={match.match.team2_score}
        broken={match.match.broken}
        recovered={match.match.recovered}
        private={match.match.private}
      />

      <div className="-mt-3 flex justify-end">
        <MatchExportButton
          matchId={match.match.match_id}
          map={match.match.map}
          queueLabel={queueLabel}
          region={match.match.region}
          duration={duration}
          team1Score={match.match.team1_score}
          team2Score={match.match.team2_score}
          team1Wins={team1Wins}
          team2Wins={team2Wins}
          team1={team1}
          team2={team2}
        />
      </div>

      {/* Player Matchup — pre-match view */}
      <MatchupSection
        team1={team1Players}
        team2={team2Players}
        team1Wins={team1Wins}
        team2Wins={team2Wins}
        team1Label="Team 1"
        team2Label="Team 2"
      />

      {/* Draft context belongs directly after the pre-match comparison. */}
      {resolvedBans.length > 0 && <BansSection bans={resolvedBans} />}

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

      {/* Loadouts — talent, cards, and purchased items */}
      <ItemsLoadoutsSection
        team1Players={team1}
        team2Players={team2}
        team1Wins={team1Wins}
        team2Wins={team2Wins}
        factMap={factMap}
      />

      {/* Rating Snapshots */}
      {snapshots.length > 0 && <RatingSnapshots snapshots={snapshots} />}

    </div>
  );
}
