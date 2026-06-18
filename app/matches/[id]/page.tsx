"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchMatchDetail,
  fetchMatchFact,
  fetchMatchSnapshots,
  fetchMatchSearch,
  type MatchDetailWithBans,
  type MatchFact,
  type MatchPlayerDetail,
  type MatchFactPlayer,
  type RatingSnapshot,
  type MatchSearchResult,
} from "@/lib/api-client";

/**
 * Match Detail Page — /matches/[id]
 *
 * Displays a full match breakdown: header metadata, two-team roster with
 * per-player stats (KDA, DPM, HPM, gold), items/cards/talents fact data,
 * ban list, and rating snapshots (pre/post Glicko-2 changes).
 *
 * Data sources:
 *   GET /api/matches/:id          → match metadata + players + bans
 *   GET /api/matches/fact/:id     → items, cards, talents per player
 *   GET /api/ratings/snapshots/:id → rating changes (pre/post mu/phi)
 *
 * @see C:\PaladinsCat\docs\frontend\match-detail.md
 */
export default function MatchDetailPage() {
  const params = useParams();
  const matchId = parseInt(params.id as string, 10);

  const [match, setMatch] = useState<MatchDetailWithBans | null>(null);
  const [fact, setFact] = useState<MatchFact | null>(null);
  const [snapshots, setSnapshots] = useState<RatingSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Related matches (same queue, nearby time)
  const [related, setRelated] = useState<MatchSearchResult[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  useEffect(() => {
    if (isNaN(matchId)) {
      setError("Invalid match ID");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [detail, factData, snaps] = await Promise.all([
          fetchMatchDetail(matchId),
          fetchMatchFact(matchId),
          fetchMatchSnapshots(matchId).catch(() => [] as RatingSnapshot[]),
        ]);

        if (!detail) {
          setError("Match not found");
          return;
        }

        setMatch(detail);
        setFact(factData);
        setSnapshots(snaps);

        // Load related matches (same queue, same region, nearby time)
        setRelatedLoading(true);
        // CRITICAL: Guard against Invalid Date. If entry_datetime is malformed,
        // new Date() produces Invalid Date, getTime() returns NaN, arithmetic
        // produces NaN, toISOString() returns "Invalid Date". The backend
        // receives "Invalid Date" as the date range → unexpected results.
        // Source: Fault #11 — "Invalid Date propagates to backend"
        const window = new Date(detail.match.entry_datetime);
        if (!isNaN(window.getTime())) {
          const from = new Date(window.getTime() - 2 * 3600 * 1000).toISOString();
          const to = new Date(window.getTime() + 2 * 3600 * 1000).toISOString();
          const searchResult = await fetchMatchSearch({
            queueId: String(detail.match.queue_id),
            region: detail.match.region,
            from,
            to,
            perPage: "5",
          }).catch(() => null);
          if (searchResult) {
            setRelated(searchResult.data.filter((m: MatchSearchResult) => m.match_id !== matchId).slice(0, 5));
          }
        }
        setRelatedLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load match");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [matchId]);

  /* ── Derived data ── */

  const queueLabel = match ? queueName(match.match.queue_id) : "";
  const isRanked = match?.match.is_ranked ?? false;
  const duration = match ? formatDuration(match.match.duration_seconds) : "";
  const timestamp = match ? new Date(match.match.entry_datetime).toLocaleString() : "";

  // Split players into two teams
  const team1: MatchPlayerDetail[] = match
    ? match.match.winning_task_force === 1
      ? match.players.filter((p) => p.task_force === 1)
      : match.players.filter((p) => p.task_force === 2)
    : [];
  const team2: MatchPlayerDetail[] = match
    ? match.match.winning_task_force === 1
      ? match.players.filter((p) => p.task_force === 2)
      : match.players.filter((p) => p.task_force === 1)
    : [];

  // Winner is the team with winning_task_force
  const winnerTF = match?.match.winning_task_force ?? 0;
  const team1Wins = winnerTF === 1;
  const team2Wins = winnerTF === 2;

  // Fact lookup by player_id
  const factMap = new Map<number, MatchFactPlayer>();
  if (fact) {
    for (const fp of fact.players) factMap.set(fp.player_id, fp);
  }

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-pc-bg-elevated rounded w-1/3" />
          <div className="h-4 bg-pc-bg-elevated rounded w-1/2" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-pc-bg-elevated rounded" />
            <div className="h-64 bg-pc-bg-elevated rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-400 text-lg">{error}</div>
        <Link href="/matches" className="text-pc-accent hover:underline mt-4 inline-block">
          ← Back to matches
        </Link>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Header ── */}
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

      {/* ── Bans ── */}
      {match.bans.length > 0 && <BansSection bans={match.bans} />}

      {/* ── Teams ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamColumn
          players={team1}
          factMap={factMap}
          wins={team1Wins}
          label="Task Force 1"
        />
        <TeamColumn
          players={team2}
          factMap={factMap}
          wins={team2Wins}
          label="Task Force 2"
        />
      </div>

      {/* ── Rating Snapshots ── */}
      {snapshots.length > 0 && <SnapshotsSection snapshots={snapshots} />}

      {/* ── Related Matches ── */}
      <RelatedMatches related={related} matchId={matchId} loading={relatedLoading} />
    </div>
  );
}

/* ── Sub-components ── */

function MatchHeader(props: {
  matchId: number;
  queueLabel: string;
  isRanked: boolean;
  map: string;
  duration: string;
  timestamp: string;
  region: string;
  team1Wins: boolean;
  team2Wins: boolean;
  team1Score: number;
  team2Score: number;
  broken: boolean;
  recovered: boolean;
  private: boolean;
}) {
  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-pc-text flex items-center gap-3">
            Match #{props.matchId}
            {props.isRanked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Ranked
              </span>
            )}
            {!props.isRanked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                Casual
              </span>
            )}
            {props.broken && !props.recovered && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Broken
              </span>
            )}
            {props.recovered && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Recovered
              </span>
            )}
            {props.private && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Private
              </span>
            )}
          </h1>
          <p className="text-pc-text-secondary mt-1">
            {props.queueLabel} · {props.map} · {props.region}
          </p>
        </div>
        <div className="text-right text-sm text-pc-text-secondary">
          <div>{props.duration}</div>
          <div>{props.timestamp}</div>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`flex-1 text-center py-2 rounded-lg ${props.team1Wins ? "bg-green-500/10 border border-green-500/30" : "bg-pc-bg-secondary"}`}>
          <div className="text-sm text-pc-text-secondary">TF 1</div>
          <div className={`text-2xl font-bold ${props.team1Wins ? "text-green-400" : "text-pc-text"}`}>
            {props.team1Score}
          </div>
        </div>
        <div className="text-pc-text-muted text-lg">vs</div>
        <div className={`flex-1 text-center py-2 rounded-lg ${props.team2Wins ? "bg-green-500/10 border border-green-500/30" : "bg-pc-bg-secondary"}`}>
          <div className="text-sm text-pc-text-secondary">TF 2</div>
          <div className={`text-2xl font-bold ${props.team2Wins ? "text-green-400" : "text-pc-text"}`}>
            {props.team2Score}
          </div>
        </div>
      </div>
    </div>
  );
}

function BansSection({ bans }: { bans: Array<{ champion_id: number; champion_name?: string }> }) {
  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-pc-text mb-3">Bans</h2>
      <div className="flex flex-wrap gap-2">
        {bans.map((b, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {b.champion_name || `#${b.champion_id}`}
          </span>
        ))}
      </div>
    </div>
  );
}

function TeamColumn({
  players,
  factMap,
  wins,
  label,
}: {
  players: MatchPlayerDetail[];
  factMap: Map<number, MatchFactPlayer>;
  wins: boolean;
  label: string;
}) {
  return (
    <div className={`rounded-xl border ${wins ? "border-green-500/30 bg-green-500/5" : "border-pc-border bg-pc-bg-elevated"}`}>
      <div className={`px-4 py-3 border-b ${wins ? "border-green-500/20 bg-green-500/10" : "border-pc-border bg-pc-bg-secondary"}`}>
        <h3 className="font-semibold text-pc-text">{label}</h3>
        {wins && <span className="text-xs text-green-400">Winner</span>}
      </div>
      <div className="divide-y divide-pc-border">
        {players.map((p) => (
          <PlayerRow key={p.player_id} player={p} fact={factMap.get(p.player_id)} />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({ player, fact }: { player: MatchPlayerDetail; fact?: MatchFactPlayer }) {
  const isWinner = player.win_status === "Winner";
  const kda = `${player.kills} / ${player.deaths} / ${player.assists}`;
  const dpm = player.damage_per_minute?.toFixed(0) ?? "—";
  const hpm = player.healing_per_minute?.toFixed(0) ?? "—";

  return (
    <div className={`px-4 py-3 hover:bg-pc-bg-secondary transition-colors ${isWinner ? "bg-green-500/5" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${isWinner ? "bg-green-400" : "bg-red-400"}`} />
          <Link
            href={`/players/${player.player_id}`}
            className="font-medium text-pc-text hover:text-pc-accent transition-colors"
          >
            {player.player_name || "PRIVATEACCOUNT"}
          </Link>
        </div>
        <div className="text-sm text-pc-text-secondary">
          {player.champion_name}
          {player.skin_name ? ` · ${player.skin_name}` : ""}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-xs text-pc-text-muted mb-2">
        <div>KDA: <span className="text-pc-text-secondary">{kda}</span></div>
        <div>DPM: <span className="text-pc-text-secondary">{dpm}</span></div>
        <div>HPM: <span className="text-pc-text-secondary">{hpm}</span></div>
      </div>

      {/* Items */}
      {fact?.items && fact.items.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {fact.items.map((item, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-pc-bg-secondary border border-pc-border text-xs text-pc-text-secondary"
            >
              Item #{item.item_id}
            </span>
          ))}
        </div>
      )}

      {/* Cards */}
      {fact?.cards && fact.cards.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {fact.cards.map((card, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400"
            >
              Card #{card.card_id}
            </span>
          ))}
        </div>
      )}

      {/* Talents */}
      {fact?.talents && fact.talents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fact.talents.map((talent, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400"
            >
              Talent #{talent.talent_id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SnapshotsSection({ snapshots }: { snapshots: RatingSnapshot[] }) {
  const formatRating = (value: number | null) => value == null ? "—" : value.toFixed(2);
  const formatChange = (value: number | null) => {
    if (value == null) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  };

  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-pc-text mb-4">Rating Changes (Glicko-2)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pc-border text-pc-text-secondary text-left">
              <th className="pb-2 pr-4">Player</th>
              <th className="pb-2 pr-4">μ Before</th>
              <th className="pb-2 pr-4">μ After</th>
              <th className="pb-2 pr-4">Δμ</th>
              <th className="pb-2 pr-4">φ Before</th>
              <th className="pb-2">φ After</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.player_id} className="border-b border-pc-border/50 hover:bg-pc-bg-secondary transition-colors">
                <td className="py-2 pr-4 font-medium text-pc-text">{s.player_name}</td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.mu_before)}</td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.mu_after)}</td>
                <td className={`py-2 pr-4 font-semibold ${s.mu_change == null ? "text-pc-text-secondary" : s.mu_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatChange(s.mu_change)}
                </td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.phi_before)}</td>
                <td className="py-2 text-pc-text-secondary">{formatRating(s.phi_after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RelatedMatches({ related, matchId, loading }: { related: MatchSearchResult[]; matchId: number; loading: boolean }) {
  if (loading) return null;
  if (related.length === 0) return null;

  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-pc-text mb-4">Related Matches</h2>
      <div className="space-y-2">
        {related.map((m) => (
          <Link
            key={m.match_id}
            href={`/matches/${m.match_id}`}
            className="flex items-center justify-between p-3 rounded-lg bg-pc-bg-secondary hover:bg-pc-bg-elevated border border-transparent hover:border-pc-border transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${m.win_status === "Winner" ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-pc-text font-medium">Match #{m.match_id}</span>
              <span className="text-pc-text-secondary text-sm">{m.champion_name}</span>
            </div>
            <div className="text-sm text-pc-text-muted">
              {m.kills}/{m.deaths}/{m.assists} · {formatDuration(m.duration_seconds)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Helpers ── */

function queueName(id: number): string {
  const map: Record<number, string> = {
    486: "Ranked 10v10",
    487: "Casual 10v10",
    488: "Custom Game",
    489: "Tournament",
  };
  return map[id] || `Queue ${id}`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
