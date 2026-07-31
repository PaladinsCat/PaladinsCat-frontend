// Browser-facing backend URL.
//
// In production the public website is served on port 80, while the direct
// backend debug port can be firewalled. The default is therefore same-origin
// `/api`, with Next rewrites forwarding `/api/*` to the backend service. Set
// NEXT_PUBLIC_API_URL only when the browser should intentionally call a
// different public backend origin.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ── Types ──

import type {
  Champion,
  ChampionStats,
  ChampionRating,
  ChampionDetail,
  Player,
  PlayerProfile,
  PlayerSearchResult,
  MatchSummary,
  MatchPlayer,
  MatchDetail,
  UserResponse,
  SessionResponse,
  PostResponse,
  CommentResponse,
  BuildResponse,
} from "./types.gen";
import { championSlug } from "./utils";
import { getStoredLobbyTierFilter, withStoredLobbyTier } from "./lobby-tier";

export type {
  Champion,
  ChampionStats,
  ChampionRating,
  ChampionDetail,
  Player,
  PlayerProfile,
  PlayerSearchResult,
  MatchSummary,
  // MatchPlayer — NOT re-exported. The local MatchPlayer interface (below)
  // has different fields (player_id, player_name, etc.) than the generated type.
  // Re-exporting it causes a type collision when pages import MatchPlayer.
  // MatchDetail — NOT re-exported. The local MatchDetailWithBans includes 'bans'.
  UserResponse,
  SessionResponse,
  PostResponse,
  CommentResponse,
  BuildResponse,
};

export interface ChampionNameOnly {
  id: number;
  name: string;
}

export interface TierStats {
  tier: string;
  winRate: number;
  pickRate: number;
  totalPlays: number;
}

export interface PatchTrend {
  trendWeek: string;
  weeklyWinRate: number;
  weeklyPlays: number;
}

export interface CounterStats {
  strongAgainst: Array<{ opponentChampionName: string; opponentChampionId: number; wins: number; totalMatches: number; winRate: number }>;
  weakAgainst: Array<{ opponentChampionName: string; opponentChampionId: number; wins: number; totalMatches: number; winRate: number }>;
}

export interface MatchRecord {
  matchId: string;
  championName: string;
  isWinner: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damageDone: number;
  duration: number;
  mapGame: string;
  entryDatetime: string;
  queueId: number | null;
  leagueTier: number | null;
  source: string | null;
  authoritative: boolean;
}

export interface TopWinrateEntry {
  id: number;
  name: string;
  roles: string;
  winRate: number | null;
  totalPlays: number | null;
}

export interface LeaderboardEntry {
  championId: number;
  championName: string;
  winRate: number;
  totalPlays: number;
  rating: number | null;
}

export interface RankedPlayer {
  rank: number;
  player_id: string;
  name: string;
  tier: number;
  points: number;
  prev_rank?: number | null;
  trend?: number;
  wins?: number;
  losses?: number;
  leaves?: number;
  winRate?: number;
  leaveRate?: number;
}

export async function fetchRankedLeaderboard(params?: { tier?: string; top?: number }): Promise<RankedPlayer[]> {
  const query = new URLSearchParams();
  if (params?.tier) query.set('tier', params.tier);
  if (params?.top != null) query.set('top', String(params.top));
  try {
    const raw = await fetchJson<Array<{
      player_id: string; name: string; tier: number; points: number;
      rank: number; prev_rank?: number; trend?: number; tier_change?: number;
      wins?: number; losses?: number; leaves?: number; winrate?: number; leaverate?: number;
    }>>(`/stats/ranked-leaderboard${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map(r => ({
      rank: r.rank,
      player_id: r.player_id,
      name: r.name,
      tier: r.tier,
      points: r.points,
      prev_rank: r.prev_rank,
      trend: r.trend,
      wins: r.wins,
      losses: r.losses,
      leaves: r.leaves,
      winRate: r.winrate,
      leaveRate: r.leaverate,
    }));
  } catch {
    return [];
  }
}

export interface CheaterPlayer {
  id: string;
  name: string;
  platform: string;
  region: string;
  kbmTier: string | null;
  cheater: boolean;
  susCount: number;
  dropper: boolean;
  afkWintrade: boolean;
  boosted: boolean;
  altAccount: boolean;
  weirdoCount: number;
  hallOfFameCount: number;
  avgDpm: number | null;
  avgHpm: number | null;
  avgCpm: number | null;
  avgSpm: number | null;
  totalMatches: number;
  winRate: number | null;
  topReasons: Array<{ reason: string; count: number }>;
}

export interface AutomaticAfkPlayer extends CheaterPlayer {
  automaticMatchCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
  lowestEcpm: number;
  averageEcpm: number;
}

export interface AutomaticAfkPlayerPage {
  players: AutomaticAfkPlayer[];
  totalCount: number;
}

export interface AutomaticAfkMatchSummary {
  matchId: number;
  entryDatetime: string | null;
  map: string | null;
  queueId: number;
  region: string | null;
  durationSeconds: number;
  championId: number | null;
  championName: string | null;
  winStatus: string | null;
  kills: number;
  deaths: number;
  assists: number;
  leagueTier: number;
  leaguePoints: number;
  source: string;
  ecpm: number;
}

export interface AutomaticAfkPlayerDetail {
  player: {
    id: string;
    name: string;
    platform: string;
    region: string;
    communityMarked: boolean;
    automaticMatchCount: number;
    firstSeen: string | null;
    lastSeen: string | null;
    lowestEcpm: number;
    averageEcpm: number;
  };
  matches: AutomaticAfkMatchSummary[];
}

export interface BoostedPlayer extends CheaterPlayer {
  partyMatchCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
  cheaters: Array<{
    id: string;
    name: string;
    matchCount: number;
    firstSeen: string | null;
    lastSeen: string | null;
  }>;
}

export interface BoostedMatchSummary {
  matchId: number;
  entryDatetime: string | null;
  map: string | null;
  queueId: number;
  region: string | null;
  durationSeconds: number;
  team1Score: number;
  team2Score: number;
  winningTaskForce: number;
  championId: number | null;
  championName: string | null;
  winStatus: string | null;
  kills: number;
  deaths: number;
  assists: number;
  leagueTier: number;
  leaguePoints: number;
  source: string;
  cheaters: Array<{ id: string; name: string }>;
}

export interface BoostedPlayerDetail {
  player: BoostedPlayer;
  matches: BoostedMatchSummary[];
}

export async function fetchCheaterPlayers(params?: { cheater?: boolean; susOnly?: boolean; weirdoOnly?: boolean; hallOfFameOnly?: boolean; dropperOnly?: boolean; afkWintradeOnly?: boolean; altAccountOnly?: boolean; limit?: number; offset?: number }): Promise<CheaterPlayer[]> {
  const query = new URLSearchParams();
  if (params?.cheater) query.set('cheater', 'true');
  if (params?.susOnly) query.set('susOnly', 'true');
  if (params?.weirdoOnly) query.set('weirdoOnly', 'true');
  if (params?.hallOfFameOnly) query.set('hallOfFameOnly', 'true');
  if (params?.dropperOnly) query.set('dropperOnly', 'true');
  if (params?.afkWintradeOnly) query.set('afkWintradeOnly', 'true');
  if (params?.altAccountOnly) query.set('altAccountOnly', 'true');
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset != null) query.set('offset', String(params.offset));
  query.set('perPage', String(params?.limit || 100));
  try {
    const raw = await fetchJson<Array<{
      id: string; name: string; platform: string; region: string;
      kbm_tier?: string | null; cheater?: boolean; sus_count?: number;
      dropper?: boolean; afk_wintrade?: boolean; boosted?: boolean; alt_account?: boolean;
      weirdo_count?: number; hall_of_fame_count?: number;
      avg_dpm?: number | null; avg_hpm?: number | null; avg_egpm?: number | null;
      avg_mpm?: number | null; total_matches?: number; win_rate?: number | null;
      top_reasons?: Array<{ reason?: string; count?: number }>;
    }>>(`/players/search?${query.toString()}`);
    return raw.map(r => ({
      id: r.id, name: r.name, platform: r.platform, region: r.region,
      kbmTier: r.kbm_tier ?? null, cheater: r.cheater ?? false,
      susCount: r.sus_count ?? 0,
      dropper: Boolean(r.dropper), afkWintrade: Boolean(r.afk_wintrade),
      boosted: Boolean(r.boosted), altAccount: Boolean(r.alt_account),
      weirdoCount: r.weirdo_count ?? 0,
      hallOfFameCount: r.hall_of_fame_count ?? 0,
      avgDpm: r.avg_dpm ?? null, avgHpm: r.avg_hpm ?? null,
      avgCpm: r.avg_egpm ?? null, avgSpm: r.avg_mpm ?? null,
      totalMatches: Number(r.total_matches) || 0, winRate: r.win_rate != null ? Number(r.win_rate) : null,
      topReasons: (r.top_reasons ?? []).map((reason) => ({ reason: reason.reason ?? "", count: Number(reason.count ?? 0) })).filter((reason) => reason.reason.length > 0),
    }));
  } catch {
    return [];
  }
}

function mapAutomaticAfkPlayer(row: any): AutomaticAfkPlayer {
  return {
    id: String(row.id),
    name: String(row.name ?? `Player ${row.id}`),
    platform: String(row.platform ?? 'Unknown'),
    region: String(row.region ?? 'Unknown'),
    kbmTier: row.kbm_tier ?? null,
    cheater: Boolean(row.cheater),
    susCount: Number(row.sus_count ?? 0),
    dropper: Boolean(row.dropper),
    afkWintrade: Boolean(row.afk_wintrade),
    boosted: Boolean(row.boosted),
    altAccount: Boolean(row.alt_account),
    weirdoCount: Number(row.weirdo_count ?? 0),
    hallOfFameCount: Number(row.hall_of_fame_count ?? 0),
    avgDpm: row.avg_dpm == null ? null : Number(row.avg_dpm),
    avgHpm: row.avg_hpm == null ? null : Number(row.avg_hpm),
    avgCpm: row.avg_egpm == null ? null : Number(row.avg_egpm),
    avgSpm: row.avg_mpm == null ? null : Number(row.avg_mpm),
    totalMatches: Number(row.total_matches ?? 0),
    winRate: row.win_rate == null ? null : Number(row.win_rate),
    topReasons: [],
    automaticMatchCount: Number(row.automatic_match_count ?? 0),
    firstSeen: row.first_seen ?? null,
    lastSeen: row.last_seen ?? null,
    lowestEcpm: Number(row.lowest_ecpm ?? 0),
    averageEcpm: Number(row.average_ecpm ?? 0),
  };
}

export async function fetchAutomaticAfkPlayers({
  limit = 24,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}): Promise<AutomaticAfkPlayerPage> {
  const query = new URLSearchParams({
    limit: String(Math.min(Math.max(limit, 1), 100)),
    offset: String(Math.max(offset, 0)),
  });
  const rows = await fetchJson<any[]>(`/players/automatic-afk?${query.toString()}`);
  return {
    players: rows.map(mapAutomaticAfkPlayer),
    totalCount: Number(rows[0]?.total_count ?? rows.length),
  };
}

export async function fetchAutomaticAfkPlayerDetail(playerId: string): Promise<AutomaticAfkPlayerDetail> {
  const raw = await fetchJson<any>(`/players/automatic-afk/${encodeURIComponent(playerId)}`);
  return {
    player: {
      id: String(raw.player.id),
      name: String(raw.player.name ?? `Player ${raw.player.id}`),
      platform: String(raw.player.platform ?? 'Unknown'),
      region: String(raw.player.region ?? 'Unknown'),
      communityMarked: Boolean(raw.player.afk_wintrade),
      automaticMatchCount: Number(raw.player.automatic_match_count ?? 0),
      firstSeen: raw.player.first_seen ?? null,
      lastSeen: raw.player.last_seen ?? null,
      lowestEcpm: Number(raw.player.lowest_ecpm ?? 0),
      averageEcpm: Number(raw.player.average_ecpm ?? 0),
    },
    matches: (raw.matches ?? []).map((row: any) => ({
      matchId: Number(row.match_id),
      entryDatetime: row.entry_datetime ?? null,
      map: row.map == null ? null : String(row.map),
      queueId: Number(row.queue_id ?? 0),
      region: row.region == null ? null : String(row.region),
      durationSeconds: Number(row.duration_seconds ?? 0),
      championId: row.champion_id == null ? null : Number(row.champion_id),
      championName: row.champion_name == null ? null : String(row.champion_name),
      winStatus: row.win_status == null ? null : String(row.win_status),
      kills: Number(row.kills ?? 0),
      deaths: Number(row.deaths ?? 0),
      assists: Number(row.assists ?? 0),
      leagueTier: Number(row.league_tier ?? 0),
      leaguePoints: Number(row.league_points ?? 0),
      source: String(row.source ?? 'direct'),
      ecpm: Number(row.ecpm ?? 0),
    })),
  };
}

export interface ClassLeaderboardEntry {
  rank: number;
  playerId: number;
  playerName: string;
  championName: string | null;
  championId: number | null;
  elo: number;
  mu: number;
  phi: number;
  winRate: number | null;
  totalMatches: number;
  totalWins: number;
  region: string | null;
}

export async function fetchClassLeaderboard(params: { role: string; limit?: number; queueId?: number; mode?: 'account' | 'champion' }): Promise<ClassLeaderboardEntry[]> {
  const query = new URLSearchParams();
  query.set('role', params.role);
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.queueId != null) query.set('queueId', String(params.queueId));
  if (params.mode) query.set('mode', params.mode);
  try {
    const raw = await fetchJson<Array<{
      rank: number; player_id: number; player_name: string;
      champion_name: string | null; champion_id: number | null;
      elo: number | string; mu: number | string; phi: number | string;
      win_rate: number | string | null; total_matches: number; total_wins: number;
      region: string | null;
    }>>(`/players/leaderboard/class?${query.toString()}`);
    return raw.map((r) => ({
      rank: Number(r.rank),
      playerId: Number(r.player_id),
      playerName: r.player_name,
      championName: r.champion_name ?? null,
      championId: r.champion_id == null ? null : Number(r.champion_id),
      elo: typeof r.elo === 'string' ? Number(r.elo) : r.elo,
      mu: typeof r.mu === 'string' ? Number(r.mu) : r.mu,
      phi: typeof r.phi === 'string' ? Number(r.phi) : r.phi,
      winRate: r.win_rate == null ? null : (typeof r.win_rate === 'string' ? Number(r.win_rate) : r.win_rate),
      totalMatches: Number(r.total_matches ?? 0),
      totalWins: Number(r.total_wins ?? 0),
      region: r.region ?? null,
    }));
  } catch {
    return [];
  }
}

export interface ChampionEloEntry {
  rank: number;
  player_id: number;
  player_name: string;
  champion_id: number;
  champion_name: string;
  class_name: string;
  elo: number;
  phi: number;
  total_matches: number;
  total_wins: number;
  win_rate: number | null;
  region: string | null;
}

export async function fetchChampionElo(params: {
  role?: string;
  championId?: number;
  limit?: number;
  queueId?: number;
}): Promise<{ data: ChampionEloEntry[]; total: number }> {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.championId) query.set('championId', String(params.championId));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.queueId) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<{ data: Array<any>; total: number }>(
      `/players/leaderboard/champion-elo?${query.toString()}`,
      { unwrapData: false }
    );
    // Coerce PostgreSQL NUMERIC strings to numbers
    const coerced: ChampionEloEntry[] = (raw.data ?? []).map((r) => ({
      rank: Number(r.rank),
      player_id: Number(r.player_id),
      player_name: String(r.player_name),
      champion_id: Number(r.champion_id),
      champion_name: String(r.champion_name),
      class_name: String(r.class_name),
      elo: Number(r.elo),
      phi: Number(r.phi),
      total_matches: Number(r.total_matches),
      total_wins: Number(r.total_wins),
      win_rate: r.win_rate != null ? Number(r.win_rate) : null,
      region: r.region ?? null,
    }));
    return { data: coerced, total: raw.total ?? 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

export interface PerformanceLeaderboardEntry {
  rank: number;
  matchId: string;
  playerId: number;
  playerName: string;
  championName: string | null;
  championId: number | null;
  className: string | null;
  value: number;
  region: string | null;
  platform: string | null;
}

export async function fetchPerformanceLeaderboard(params: {
  metric: 'dpm' | 'hpm' | 'gpm' | 'mpm';
  limit?: number;
  role?: string;
  region?: string;
  queueId?: number;
  scope?: 'ranked' | 'casual';
}): Promise<PerformanceLeaderboardEntry[]> {
  const query = new URLSearchParams();
  query.set('metric', params.metric);
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.role) query.set('role', params.role);
  if (params.region) query.set('region', params.region);
  if (params.queueId != null) query.set('queueId', String(params.queueId));
  if (params.scope) query.set('scope', params.scope);
  try {
    const raw = await fetchJson<Array<{
      rank: number; match_id: number | string; player_id: number; player_name: string;
      champion_name: string | null; champion_id: number | null; class_name: string | null;
      value: number | string; region: string | null; platform: string | null;
    }>>(`/players/leaderboard/performance?${query.toString()}`);
    return raw.map((r) => ({
      rank: Number(r.rank),
      matchId: String(r.match_id),
      playerId: Number(r.player_id),
      playerName: r.player_name,
      championName: r.champion_name ?? null,
      championId: r.champion_id ?? null,
      className: r.class_name ?? null,
      value: typeof r.value === 'string' ? Number(r.value) : r.value,
      region: r.region ?? null,
      platform: r.platform ?? null,
    }));
  } catch {
    return [];
  }
}

export interface PerformanceMetricSummary {
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  sampleSize: number;
}

export type PerformanceMetricKey = 'dpm' | 'wpm' | 'apm' | 'hpm' | 'gpm' | 'egpm' | 'mpm' | 'kda';

export type PerformanceMetricsResponse = Partial<Record<PerformanceMetricKey, PerformanceMetricSummary>>;

function mapMetricSummary(raw: any): PerformanceMetricSummary {
  return {
    min: Number(raw?.min ?? 0),
    max: Number(raw?.max ?? 0),
    mean: Number(raw?.mean ?? 0),
    median: Number(raw?.median ?? 0),
    mode: Number(raw?.mode ?? 0),
    p10: Number(raw?.p10 ?? 0),
    p25: Number(raw?.p25 ?? 0),
    p75: Number(raw?.p75 ?? 0),
    p90: Number(raw?.p90 ?? 0),
    sampleSize: Number(raw?.sample_size ?? raw?.sampleSize ?? 0),
  };
}

export async function fetchPerformanceMetrics(params?: {
  metric?: PerformanceMetricKey;
  role?: string;
  queueId?: number;
  tierMin?: number;
  tierMax?: number;
  scope?: 'ranked' | 'casual';
}): Promise<PerformanceMetricsResponse> {
  const query = new URLSearchParams();
  if (params?.metric) query.set('metric', params.metric);
  if (params?.role) query.set('role', params.role);
  if (params?.queueId != null) query.set('queueId', String(params.queueId));
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  if (params?.scope) query.set('scope', params.scope);
  try {
    const raw = await fetchJson<Record<string, any>>(`/stats/performance-metrics${query.toString() ? `?${query.toString()}` : ''}`);
    return Object.fromEntries(
      Object.entries(raw).map(([metric, summary]) => [metric, mapMetricSummary(summary)])
    ) as PerformanceMetricsResponse;
  } catch {
    return {};
  }
}

/**
 * Fetch the global and each class's summary in one cacheable API response.
 * The metrics page used to make five nearly identical requests per tab.
 */
export async function fetchPerformanceMetricDashboard(metric: PerformanceMetricKey): Promise<{
  summary: PerformanceMetricSummary;
  roles: Record<string, PerformanceMetricSummary>;
}> {
  try {
    const query = new URLSearchParams({ metric, includeRoles: '1' });
    const raw = await fetchJson<Record<string, any>>(`/stats/performance-metrics?${query.toString()}`);
    return {
      summary: mapMetricSummary(raw[metric]),
      roles: Object.fromEntries(
        Object.entries(raw.roles ?? {}).map(([role, summary]) => [role, mapMetricSummary(summary)])
      ),
    };
  } catch {
    return { summary: mapMetricSummary(null), roles: {} };
  }
}

export interface ChampionPerformanceDistribution {
  championId: number;
  championName: string;
  className: string;
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number;
  p10: number;
  p90: number;
  avgValue: number;
  totalMatches: number;
}

export async function fetchChampionPerformanceDistributions(params: {
  metric: PerformanceMetricKey;
  championId?: number;
  queueId?: number;
}): Promise<ChampionPerformanceDistribution[]> {
  const query = new URLSearchParams();
  query.set('metric', params.metric);
  if (params.championId != null) query.set('championId', String(params.championId));
  if (params.queueId != null) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Array<{
      champion_id: number; champion_name: string; class: string;
      min: number | string; max: number | string; mean: number | string;
      median: number | string; mode: number | string; p10?: number | string; p90?: number | string; avg_value: number | string;
      total_matches: number;
    }>>(`/stats/performance-metrics/by-champion?${query.toString()}`);
    return raw.map((r) => ({
      championId: r.champion_id,
      championName: r.champion_name,
      className: r.class,
      min: Number(r.min ?? 0),
      max: Number(r.max ?? 0),
      mean: Number(r.mean ?? 0),
      median: Number(r.median ?? 0),
      mode: Number(r.mode ?? 0),
      p10: Number(r.p10 ?? 0),
      p90: Number(r.p90 ?? 0),
      avgValue: Number(r.avg_value ?? 0),
      totalMatches: Number(r.total_matches ?? 0),
    }));
  } catch {
    return [];
  }
}

export interface BaselineEntry {
  role: string;
  queueId: number;
  avgCpm: number;
  avgDpm: number;
  avgHpm: number;
  avgShpm: number;
  avgSpm: number;
  avgKda: number;
  p10Cpm: number;
  p90Cpm: number;
  p10Dpm: number;
  p90Dpm: number;
  avgEcpm: number;
  p10Ecpm: number;
  p25Ecpm: number;
  p75Ecpm: number;
  p90Ecpm: number;
  maxEcpm: number;
  sampleSize: number;
  updatedAt: string | null;
}

export async function fetchBaselines(params?: { role?: string; queueId?: number; tierMin?: number; tierMax?: number }): Promise<BaselineEntry[]> {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.queueId) query.set('queueId', String(params.queueId));
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  try {
    const raw = await fetchJson<Array<{
      role: string; queue_id: number;
      avg_gpm: number; avg_dpm: number; avg_hpm: number;
      avg_shpm: number; avg_mpm: number; avg_kda: number;
      p10_gpm: number; p90_gpm: number; p10_dpm: number; p90_dpm: number;
      avg_egpm: number; p10_egpm: number; p25_egpm: number; p75_egpm: number; p90_egpm: number; max_egpm: number;
      sample_size: number; updated_at?: string | null;
    }>>(`/stats/baselines${query.toString() ? `?${query.toString()}` : ''}`);
    const mapped = raw.map(r => ({
      role: r.role, queueId: r.queue_id,
      avgCpm: Number(r.avg_gpm ?? 0), avgDpm: Number(r.avg_dpm ?? 0), avgHpm: Number(r.avg_hpm ?? 0),
      avgShpm: Number(r.avg_shpm ?? 0), avgSpm: Number(r.avg_mpm ?? 0), avgKda: Number(r.avg_kda ?? 0),
      p10Cpm: Number(r.p10_gpm ?? 0), p90Cpm: Number(r.p90_gpm ?? 0), p10Dpm: Number(r.p10_dpm ?? 0), p90Dpm: Number(r.p90_dpm ?? 0),
      avgEcpm: Number(r.avg_egpm ?? 0), p10Ecpm: Number(r.p10_egpm ?? 0), p25Ecpm: Number(r.p25_egpm ?? 0),
      p75Ecpm: Number(r.p75_egpm ?? 0), p90Ecpm: Number(r.p90_egpm ?? 0), maxEcpm: Number(r.max_egpm ?? 0),
      sampleSize: Number(r.sample_size ?? 0),
      updatedAt: r.updated_at ?? null,
    }));
    if (!mapped.some((row) => row.role === 'Global')) {
      const global = (await fetchPerformanceMetrics({
        metric: 'egpm', queueId: params?.queueId, tierMin: params?.tierMin, tierMax: params?.tierMax,
      })).egpm;
      if (global) {
        mapped.unshift({
          role: 'Global', queueId: params?.queueId ?? 486,
          avgCpm: global.mean, avgDpm: 0, avgHpm: 0, avgShpm: 0, avgSpm: 0, avgKda: 0,
          p10Cpm: global.p10, p90Cpm: global.p90, p10Dpm: 0, p90Dpm: 0,
          avgEcpm: global.mean, p10Ecpm: global.p10, p25Ecpm: global.p25,
          p75Ecpm: global.p75, p90Ecpm: global.p90, maxEcpm: global.max,
          sampleSize: global.sampleSize, updatedAt: null,
        });
      }
    }
    return mapped;
  } catch {
    return [];
  }
}

export interface PatchTrendEntry {
  trendWeek: string;
  patchVersion: string;
  championId: number;
  championName: string;
  weeklyWinRate: number;
  weeklyPlays: number;
}

export interface RegionStat {
  regionCode: string;
  regionName: string;
  continent: string;
  avgDuration: number;
  topChampions: Array<{ championName: string; championId: number; wins: number; totalPlays: number; winRate: number }>;
}

export interface LoadoutStat {
  deckHash: string;
  championId: number;
  championName: string;
  totalMatches: number;
  totalUses: number;
  wins: number;
  losses: number;
  winRate: number;
  rankedWins: number;
  rankedWinRate: number;
  highTierWins: number;
  highTierWinRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgDpm: number;
  avgHpm: number;
  loadoutItems: Array<{ item_name: string; usage_rate: number }> | null;
  lastRefreshed: string;
}

export interface ItemStat {
  itemId: number;
  itemName: string;
  totalUsage: number;
  winRate: number;
  pickRate?: number;
  slots: ItemDimensionStat[];
  levels: ItemDimensionStat[];
  breakdown: ItemDimensionStat[];
}

export interface PlayersOverview {
  championEloPlayers: ChampionEloEntry[];
  performanceLeaderboards: Record<string, PerformanceLeaderboardEntry[]>;
  rankedPlayers: RankedPlayer[];
  accountEloPlayers: ClassLeaderboardEntry[];
  cheaterPlayers: CheaterPlayer[];
  boostedPlayers: BoostedPlayer[];
  suspiciousPlayers: CheaterPlayer[];
  weirdoPlayers: CheaterPlayer[];
  hallOfFamePlayers: CheaterPlayer[];
  privateAccounts: PrivateAccountSummary[];
  partyPairs: PartyPairSummary[];
  communityCounts: {
    cheaters: number;
    boosted: number;
    suspicious: number;
    weirdos: number;
    hallOfFame: number;
    droppers: number;
    afkWintrade: number;
    altAccounts: number;
  };
  directoryCounts: {
    privateAccounts: number;
    parties: number;
  };
}

function mapBoostedPlayer(row: any): BoostedPlayer {
  return {
    id: String(row.id), name: row.name, platform: row.platform, region: row.region,
    kbmTier: row.kbm_tier ?? null, cheater: Boolean(row.cheater), susCount: Number(row.sus_count ?? 0),
    dropper: Boolean(row.dropper), afkWintrade: Boolean(row.afk_wintrade),
    boosted: Boolean(row.boosted ?? true), altAccount: Boolean(row.alt_account),
    weirdoCount: Number(row.weirdo_count ?? 0), hallOfFameCount: Number(row.hall_of_fame_count ?? 0),
    avgDpm: row.avg_dpm ?? null, avgHpm: row.avg_hpm ?? null,
    avgCpm: row.avg_egpm ?? null, avgSpm: row.avg_mpm ?? null,
    totalMatches: Number(row.total_matches ?? 0), winRate: row.win_rate == null ? null : Number(row.win_rate),
    topReasons: [],
    partyMatchCount: Number(row.party_match_count ?? 0),
    firstSeen: row.first_seen ?? null,
    lastSeen: row.last_seen ?? null,
    cheaters: (row.cheaters ?? []).map((cheater: any) => ({
      id: String(cheater.id ?? ""),
      name: cheater.name ?? "Unknown player",
      matchCount: Number(cheater.match_count ?? 0),
      firstSeen: cheater.first_seen ?? null,
      lastSeen: cheater.last_seen ?? null,
    })).filter((cheater: { id: string }) => cheater.id.length > 0),
  };
}

export async function fetchBoostedPlayers(limit = 100): Promise<BoostedPlayer[]> {
  const raw = await fetchJson<any[]>(`/players/boosted?limit=${Math.min(Math.max(limit, 1), 100)}`);
  return raw.map(mapBoostedPlayer);
}

export async function fetchBoostedPlayerDetail(playerId: string): Promise<BoostedPlayerDetail> {
  const raw = await fetchJson<any>(`/players/boosted/${encodeURIComponent(playerId)}`);
  return {
    player: mapBoostedPlayer(raw.player),
    matches: (raw.matches ?? []).map((row: any) => ({
      matchId: Number(row.match_id),
      entryDatetime: row.entry_datetime ?? null,
      map: row.map == null ? null : String(row.map),
      queueId: Number(row.queue_id ?? 0),
      region: row.region == null ? null : String(row.region),
      durationSeconds: Number(row.duration_seconds ?? 0),
      team1Score: Number(row.team1_score ?? 0),
      team2Score: Number(row.team2_score ?? 0),
      winningTaskForce: Number(row.winning_task_force ?? 0),
      championId: row.champion_id == null ? null : Number(row.champion_id),
      championName: row.champion_name == null ? null : String(row.champion_name),
      winStatus: row.win_status == null ? null : String(row.win_status),
      kills: Number(row.kills ?? 0),
      deaths: Number(row.deaths ?? 0),
      assists: Number(row.assists ?? 0),
      leagueTier: Number(row.league_tier ?? 0),
      leaguePoints: Number(row.league_points ?? 0),
      source: String(row.source ?? 'direct'),
      cheaters: (row.cheaters ?? []).map((cheater: any) => ({
        id: String(cheater.id ?? ''),
        name: String(cheater.name ?? 'Unknown player'),
      })).filter((cheater: { id: string }) => cheater.id.length > 0),
    })),
  };
}

export interface PrivateAccountSummary {
  id: number;
  alias: string | null;
  verifiedName: string | null;
  displayName: string;
  partyId: number;
  accountLevel: number;
  masteryLevel: number;
  leagueTier: number;
  leaguePoints: number;
  matchCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
  identityStatus: string;
  identityConfidence: number;
  trackingVersion: number;
  cheater: boolean;
  cheaterReason: string | null;
  cheaterMarkedAt: string | null;
  susCount: number;
  topReasons: Array<{ reason: string; count: number }>;
}

export interface PrivateAccountObservationSummary {
  matchId: number;
  privateSlot: number;
  entryDatetime: string | null;
  accountLevel: number;
  masteryLevel: number;
  leagueTier: number;
  leaguePoints: number;
  tpDelta: number | null;
  winStatus: string | null;
  championId: number | null;
  championName: string | null;
  taskForce: number;
  platform: string | null;
  source: string;
  resolutionStatus: string;
  resolutionConfidence: number;
  map: string | null;
  queueId: number;
  region: string | null;
  durationSeconds: number;
}

export interface PrivateAccountDetail {
  account: PrivateAccountSummary;
  observations: PrivateAccountObservationSummary[];
}

export interface PartyPairSummary {
  sourcePlayerId: number;
  sourcePlayerName: string;
  targetPlayerId: number;
  targetPlayerName: string;
  matchCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface PartyStackSummary {
  groupKey: string;
  stackSize: number;
  players: Array<{ id: number; name: string }>;
  matchCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface PlayerDirectoryPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function mapPrivateAccount(row: any): PrivateAccountSummary {
  const id = Number(row.id);
  const storedAlias = row.alias == null ? "" : String(row.alias).trim();
  const alias = !storedAlias || /^private-\d+$/i.test(storedAlias)
    ? `P-${String(id).padStart(6, "0")}`
    : storedAlias;
  const verifiedName = row.verified_name == null ? null : String(row.verified_name);
  return {
    id,
    alias,
    verifiedName,
    displayName: verifiedName ?? alias,
    partyId: Number(row.party_id ?? 0),
    accountLevel: Number(row.account_level ?? 0),
    masteryLevel: Number(row.mastery_level ?? 0),
    leagueTier: Number(row.league_tier ?? 0),
    leaguePoints: Number(row.league_points ?? 0),
    matchCount: Number(row.match_count ?? 0),
    firstSeen: row.first_seen ?? null,
    lastSeen: row.last_seen ?? null,
    identityStatus: String(row.identity_status ?? 'inferred'),
    identityConfidence: Number(row.identity_confidence ?? 0),
    trackingVersion: Number(row.tracking_version ?? 1),
    cheater: Boolean(row.cheater),
    cheaterReason: row.cheater_reason == null ? null : String(row.cheater_reason),
    cheaterMarkedAt: row.cheater_marked_at ?? null,
    susCount: Number(row.sus_count ?? 0),
    topReasons: (Array.isArray(row.top_reasons) ? row.top_reasons : []).map((reason: any) => ({
      reason: String(reason.reason ?? ''),
      count: Number(reason.count ?? 0),
    })).filter((reason: { reason: string }) => reason.reason.length > 0),
  };
}

function mapPartyPair(row: any): PartyPairSummary {
  return {
    sourcePlayerId: Number(row.source_player_id),
    sourcePlayerName: String(row.source_player_name ?? 'Unknown'),
    targetPlayerId: Number(row.target_player_id),
    targetPlayerName: String(row.target_player_name ?? 'Unknown'),
    matchCount: Number(row.match_count ?? 0),
    firstSeen: row.first_seen ?? null,
    lastSeen: row.last_seen ?? null,
  };
}

export async function fetchPrivateAccountsDirectory(params: { page?: number; pageSize?: number; query?: string; cheater?: boolean; suspicious?: boolean } = {}): Promise<PlayerDirectoryPage<PrivateAccountSummary>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const query = new URLSearchParams({ page: String(page), perPage: String(pageSize) });
  if (params.query?.trim()) query.set('q', params.query.trim());
  if (params.cheater !== undefined) query.set('cheater', String(params.cheater));
  if (params.suspicious !== undefined) query.set('suspicious', String(params.suspicious));
  const rows = await fetchJson<any[]>(`/player-ext/private?${query.toString()}`);
  const total = Number(rows[0]?.total_count ?? 0);
  return { items: rows.map(mapPrivateAccount), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function fetchPrivateAccountDetail(privateId: number): Promise<PrivateAccountDetail> {
  const raw = await fetchJson<any>(`/player-ext/private/${privateId}`);
  return {
    account: mapPrivateAccount(raw.account),
    observations: (raw.observations ?? []).map((row: any) => ({
      matchId: Number(row.match_id),
      privateSlot: Number(row.private_slot ?? 0),
      entryDatetime: row.entry_datetime ?? null,
      accountLevel: Number(row.account_level ?? 0),
      masteryLevel: Number(row.mastery_level ?? 0),
      leagueTier: Number(row.league_tier ?? 0),
      leaguePoints: Number(row.league_points ?? 0),
      tpDelta: row.tp_delta == null ? null : Number(row.tp_delta),
      winStatus: row.win_status == null ? null : String(row.win_status),
      championId: row.champion_id == null ? null : Number(row.champion_id),
      championName: row.champion_name == null ? null : String(row.champion_name),
      taskForce: Number(row.task_force ?? 0),
      platform: row.platform == null ? null : String(row.platform),
      source: String(row.source ?? 'direct'),
      resolutionStatus: String(row.resolution_status ?? 'unresolved'),
      resolutionConfidence: Number(row.resolution_confidence ?? 0),
      map: row.map == null ? null : String(row.map),
      queueId: Number(row.queue_id ?? 0),
      region: row.region == null ? null : String(row.region),
      durationSeconds: Number(row.duration_seconds ?? 0),
    })),
  };
}

export async function fetchPartyPairsDirectory(params: { page?: number; pageSize?: number; query?: string } = {}): Promise<PlayerDirectoryPage<PartyPairSummary>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const query = new URLSearchParams({ page: String(page), perPage: String(pageSize), kind: 'pairs' });
  if (params.query?.trim()) query.set('q', params.query.trim());
  const rows = await fetchJson<any[]>(`/coplay/parties?${query.toString()}`);
  const total = Number(rows[0]?.total_count ?? 0);
  return { items: rows.map(mapPartyPair), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function fetchPartyStacksDirectory(params: { page?: number; pageSize?: number; query?: string; size?: number | null } = {}): Promise<PlayerDirectoryPage<PartyStackSummary>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const query = new URLSearchParams({ page: String(page), perPage: String(pageSize), kind: 'stacks' });
  if (params.query?.trim()) query.set('q', params.query.trim());
  if (params.size && params.size >= 2 && params.size <= 5) query.set('size', String(params.size));
  const rows = await fetchJson<any[]>(`/coplay/parties?${query.toString()}`);
  const total = Number(rows[0]?.total_count ?? 0);
  const items = rows.map((row): PartyStackSummary => {
    const ids = Array.isArray(row.player_ids) ? row.player_ids.map(Number) : [];
    const names = Array.isArray(row.player_names) ? row.player_names.map(String) : [];
    return {
      groupKey: String(row.group_key),
      stackSize: Number(row.stack_size ?? ids.length),
      players: ids.map((id: number, index: number) => ({ id, name: names[index] ?? `Player ${id}` })),
      matchCount: Number(row.match_count ?? 0),
      firstSeen: row.first_seen ?? null,
      lastSeen: row.last_seen ?? null,
    };
  });
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

let playersOverviewCache: { value: PlayersOverview; expiresAt: number } | null = null;
let playersOverviewInFlight: Promise<PlayersOverview> | null = null;

/** Normalize the backend overview payload for both server and browser renders. */
export function mapPlayersOverviewResponse(raw: any): PlayersOverview {
  const mapChampionElo = (row: any): ChampionEloEntry => ({
    rank: Number(row.rank), player_id: Number(row.player_id), player_name: String(row.player_name),
    champion_id: Number(row.champion_id), champion_name: String(row.champion_name), class_name: String(row.class_name),
    elo: Number(row.elo), phi: Number(row.phi), total_matches: Number(row.total_matches),
    total_wins: Number(row.total_wins), win_rate: row.win_rate == null ? null : Number(row.win_rate), region: row.region ?? null,
  });
  const mapPerformance = (row: any): PerformanceLeaderboardEntry => ({
    rank: Number(row.rank), matchId: String(row.match_id), playerId: Number(row.player_id), playerName: row.player_name,
    championName: row.champion_name ?? null, championId: row.champion_id == null ? null : Number(row.champion_id),
    className: row.class_name ?? null, value: Number(row.value),
    region: row.region ?? null, platform: row.platform ?? null,
  });
  const mapRanked = (row: any): RankedPlayer => ({
    rank: Number(row.rank), player_id: String(row.player_id), name: row.name, tier: Number(row.tier), points: Number(row.points),
    prev_rank: row.prev_rank, trend: row.trend, wins: row.wins, losses: row.losses, leaves: row.leaves,
    winRate: row.winrate == null ? undefined : Number(row.winrate), leaveRate: row.leaverate == null ? undefined : Number(row.leaverate),
  });
  const mapAccountElo = (row: any): ClassLeaderboardEntry => ({
    rank: Number(row.rank), playerId: Number(row.player_id), playerName: row.player_name,
    championName: row.champion_name ?? null, championId: row.champion_id == null ? null : Number(row.champion_id),
    elo: Number(row.elo), mu: Number(row.mu), phi: Number(row.phi),
    winRate: row.win_rate == null ? null : Number(row.win_rate), totalMatches: Number(row.total_matches ?? 0),
    totalWins: Number(row.total_wins ?? 0), region: row.region ?? null,
  });
  const mapCommunity = (row: any): CheaterPlayer => ({
    id: String(row.id), name: row.name, platform: row.platform, region: row.region,
    kbmTier: row.kbm_tier ?? null, cheater: row.cheater ?? false, susCount: Number(row.sus_count ?? 0),
    dropper: Boolean(row.dropper), afkWintrade: Boolean(row.afk_wintrade),
    boosted: Boolean(row.boosted), altAccount: Boolean(row.alt_account),
    weirdoCount: Number(row.weirdo_count ?? 0), hallOfFameCount: Number(row.hall_of_fame_count ?? 0),
    avgDpm: row.avg_dpm == null ? null : Number(row.avg_dpm), avgHpm: row.avg_hpm == null ? null : Number(row.avg_hpm),
    avgCpm: row.avg_egpm == null ? null : Number(row.avg_egpm), avgSpm: row.avg_mpm == null ? null : Number(row.avg_mpm),
    totalMatches: Number(row.total_matches ?? 0), winRate: row.win_rate == null ? null : Number(row.win_rate),
    topReasons: Array.isArray(row.top_reasons) ? row.top_reasons.map((reason: any) => ({ reason: String(reason?.reason ?? ""), count: Number(reason?.count ?? 0) })).filter((reason: { reason: string }) => reason.reason.length > 0) : [],
  });
  const mapBoosted = (row: any): BoostedPlayer => ({
    ...mapCommunity(row),
    partyMatchCount: Number(row.party_match_count ?? 0),
    firstSeen: row.first_seen ?? null,
    lastSeen: row.last_seen ?? null,
    cheaters: Array.isArray(row.cheaters) ? row.cheaters.map((cheater: any) => ({
      id: String(cheater?.id ?? ""),
      name: String(cheater?.name ?? "Unknown player"),
      matchCount: Number(cheater?.match_count ?? 0),
      firstSeen: cheater?.first_seen ?? null,
      lastSeen: cheater?.last_seen ?? null,
    })).filter((cheater: { id: string }) => cheater.id.length > 0) : [],
  });
  const communityCounts = {
    cheaters: Number(raw.community_counts?.cheaters ?? raw.cheaters?.[0]?.total_count ?? raw.cheaters?.length ?? 0),
    boosted: Number(raw.community_counts?.boosted ?? raw.boosted?.[0]?.total_count ?? raw.boosted?.length ?? 0),
    suspicious: Number(raw.community_counts?.suspicious ?? raw.suspicious?.[0]?.total_count ?? raw.suspicious?.length ?? 0),
    weirdos: Number(raw.community_counts?.weirdos ?? raw.weirdos?.[0]?.total_count ?? raw.weirdos?.length ?? 0),
    hallOfFame: Number(raw.community_counts?.hall_of_fame ?? raw.hall_of_fame?.[0]?.total_count ?? raw.hall_of_fame?.length ?? 0),
    droppers: Number(raw.community_counts?.droppers ?? raw.droppers?.[0]?.total_count ?? raw.droppers?.length ?? 0),
    afkWintrade: Number(raw.community_counts?.afk_wintrade ?? raw.afk_wintrade?.[0]?.total_count ?? raw.afk_wintrade?.length ?? 0),
    altAccounts: Number(raw.community_counts?.alt_accounts ?? raw.alt_accounts?.[0]?.total_count ?? raw.alt_accounts?.length ?? 0),
  };
  const privateAccounts: PrivateAccountSummary[] = (raw.private_accounts ?? []).map(mapPrivateAccount);
  const partyPairs: PartyPairSummary[] = (raw.party_pairs ?? []).map(mapPartyPair);
  const directoryCounts = {
    privateAccounts: Number(raw.directory_counts?.private_accounts ?? raw.private_accounts?.[0]?.total_count ?? privateAccounts.length),
    parties: Number(raw.directory_counts?.parties ?? raw.party_pairs?.[0]?.total_count ?? partyPairs.length),
  };

  return {
    championEloPlayers: (raw.champion_elo?.data ?? []).map(mapChampionElo),
    performanceLeaderboards: Object.fromEntries(
      Object.entries(raw.performance ?? {}).map(([metric, response]) => [metric, ((response as any)?.data ?? []).map(mapPerformance)]),
    ),
    rankedPlayers: (raw.ranked ?? []).map(mapRanked),
    accountEloPlayers: (raw.account_elo?.data ?? []).map(mapAccountElo),
    cheaterPlayers: (raw.cheaters ?? []).map(mapCommunity),
    boostedPlayers: (raw.boosted ?? []).map(mapBoosted),
    suspiciousPlayers: (raw.suspicious ?? []).map(mapCommunity),
    weirdoPlayers: (raw.weirdos ?? []).map(mapCommunity),
    hallOfFamePlayers: (raw.hall_of_fame ?? []).map(mapCommunity),
    privateAccounts,
    partyPairs,
    communityCounts,
    directoryCounts,
  };
}

/**
 * Fetch the directory landing-page data in one request. The short module cache
 * prevents navigation between top-level pages from immediately refetching the
 * same mostly-static leaderboard cards.
 */
export async function fetchPlayersOverview(): Promise<PlayersOverview> {
  if (playersOverviewCache && playersOverviewCache.expiresAt > Date.now()) {
    return playersOverviewCache.value;
  }
  if (playersOverviewInFlight) return playersOverviewInFlight;

  playersOverviewInFlight = (async () => {
    const raw = await fetchJson<any>('/players/overview', { unwrapData: false });
    const overview = mapPlayersOverviewResponse(raw);
    playersOverviewCache = { value: overview, expiresAt: Date.now() + 60_000 };
    return overview;
  })();

  try {
    return await playersOverviewInFlight;
  } finally {
    playersOverviewInFlight = null;
  }
}

export interface MapStat {
  name: string;
  totalMatches: number;
  distributionRate: number;
  avgDurationSeconds: number;
}

export interface MapChampionStat {
  championId: number;
  championName: string;
  totalPlays: number;
  wins: number;
  losses: number;
  totalBans: number;
  winRate: number;
  pickRate: number;
  banRate: number;
}

export interface ChampionMapStat {
  name: string;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
  pickRate: number;
}

export interface MapTalentStat {
  talentId: number;
  talentName: string;
  championId: number;
  championName: string;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
  pickRate: number;
}

export interface MapItemStat {
  itemId: number;
  itemName: string;
  totalUses: number;
  wins: number;
  losses: number;
  winRate: number;
  pickRate: number;
}

export interface MapDetailStats {
  map: MapStat;
  champions: MapChampionStat[];
  talents: MapTalentStat[];
  items: MapItemStat[];
  compositions: MatchCompositionStat[];
}

export interface AltAccountRelationPlayer {
  id: string;
  name: string;
  region: string;
  platform: string;
  cheater: boolean;
  susCount: number;
  dropper: boolean;
  afkWintrade: boolean;
  altAccount: boolean;
}

export interface AltAccountDirectoryGroup {
  main: AltAccountRelationPlayer;
  altAccounts: Array<AltAccountRelationPlayer & { voteCount: number; lastVotedAt: string | null }>;
  totalVotes: number;
  lastVotedAt: string | null;
}

export interface MyAltAccountRelation {
  id: number;
  mainPlayerId: string;
  mainPlayerName: string;
  altPlayerId: string;
  altPlayerName: string;
  createdAt: string;
  updatedAt: string;
}

function mapAltRelationPlayer(row: any, prefix = ''): AltAccountRelationPlayer {
  return {
    id: String(row[`${prefix}id`] ?? ''),
    name: String(row[`${prefix}name`] ?? 'Unknown player'),
    region: String(row[`${prefix}region`] ?? '—'),
    platform: String(row[`${prefix}platform`] ?? '—'),
    cheater: Boolean(row[`${prefix}cheater`]),
    susCount: Number(row[`${prefix}sus_count`] ?? 0),
    dropper: Boolean(row[`${prefix}dropper`]),
    afkWintrade: Boolean(row[`${prefix}afk_wintrade`]),
    altAccount: Boolean(row[`${prefix}alt_account`]),
  };
}

export async function fetchAltAccountRelationsDirectory(params: { page?: number; pageSize?: number; query?: string } = {}): Promise<PlayerDirectoryPage<AltAccountDirectoryGroup>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
  const query = new URLSearchParams({ page: String(page), perPage: String(pageSize) });
  if (params.query?.trim()) query.set('q', params.query.trim());
  const rows = await fetchJson<any[]>(`/players/alt-account-relations?${query.toString()}`);
  const total = Number(rows[0]?.total_count ?? 0);
  const items = rows.map((row): AltAccountDirectoryGroup => ({
    main: mapAltRelationPlayer({
      main_player_id: row.main_player_id,
      main_player_name: row.main_player_name,
      main_player_region: row.main_player_region,
      main_player_platform: row.main_player_platform,
      main_player_cheater: row.main_player_cheater,
      main_player_sus_count: row.main_player_sus_count,
      main_player_dropper: row.main_player_dropper,
      main_player_afk_wintrade: row.main_player_afk_wintrade,
      main_player_alt_account: row.main_player_alt_account,
    }, 'main_player_'),
    altAccounts: (Array.isArray(row.alt_accounts) ? row.alt_accounts : []).map((alt: any) => ({
      ...mapAltRelationPlayer(alt),
      voteCount: Number(alt.vote_count ?? 0),
      lastVotedAt: alt.last_voted_at ?? null,
    })),
    totalVotes: Number(row.total_votes ?? 0),
    lastVotedAt: row.last_voted_at ?? null,
  }));
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function fetchMyAltAccountRelations(playerId: string | number): Promise<MyAltAccountRelation[]> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.authenticationRequired);
  const rows = await fetchJson<any[]>(`/players/${playerId}/alt-account-relations/mine`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return rows.map((row) => ({
    id: Number(row.id),
    mainPlayerId: String(row.main_player_id),
    mainPlayerName: String(row.main_player_name ?? 'Unknown player'),
    altPlayerId: String(row.alt_player_id),
    altPlayerName: String(row.alt_player_name ?? 'Unknown player'),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function voteAltAccountRelation(playerId: string | number, otherPlayerId: string | number, otherRole: 'main' | 'alt'): Promise<{ success: boolean; replaced: boolean }> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.authenticationRequired);
  return fetchJson(`/players/${playerId}/alt-account-relations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ otherPlayerId, otherRole }),
  });
}

export async function clearMyAltAccountRelation(playerId: string | number, otherPlayerId: string | number): Promise<{ success: boolean; removed: boolean }> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.authenticationRequired);
  return fetchJson(`/players/${playerId}/alt-account-relations/${otherPlayerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type MapComparisonSection = 'champions' | 'talents' | 'items' | 'compositions';

export interface MapCategoryComparisonStat {
  entityKey: string;
  mapName: string;
  totalCount: number;
  wins: number;
  losses: number;
  totalBans: number;
  winRate: number;
  pickRate: number;
  banRate: number;
}

export interface HourlyMatchCount {
  date: string;
  hour: number;
  queueId: number;
  matches: {
    NA: number;
    EU: number;
    Asia: number;
    BR: number;
    OCE: number;
    SA: number;
    Unknown: number;
  };
  totalMatches: number;
  fetchedAt: string | null;
}

export interface DatabaseStats {
  tables: Array<{ name: string; rowCount: number }>;
  timestamp: string;
}

export interface SystemStatus {
  matches: number;
  players: number;
  pendingPulls: number;
  lastMatch: string | null;
  timestamp: string;
}

export interface HirezOutageItem {
  serviceKey: string;
  status: string;
  title: string;
  severity: "critical" | "warning";
  message: string;
  reason: string | null;
  firstDetectedAt: string | null;
  lastDetectedAt: string | null;
  nextProbeAt: string | null;
  probeDue: boolean;
  probeCount: number;
  updatedAt: string | null;
}

export interface HirezOutageSignal {
  source: string;
  message: string;
  observedAt: string | null;
  code: string;
  serviceKey: string;
  title: string;
  severity: "critical" | "warning";
  publicMessage: string;
}

export interface HirezServiceStatus {
  status: "ok" | "degraded" | "outage";
  outage: boolean;
  degraded: boolean;
  message: string;
  activeOutages: HirezOutageItem[];
  recentSignals: HirezOutageSignal[];
  pendingVendorDebt: number;
  dueVendorDebt: number;
  affectedHours: number;
  nextDebtRetryAt: string | null;
  signalLookbackMinutes: number;
  timestamp: string;
}

export interface Notification {
  id: number;
  timestamp: string;
  importance: number;
  message: string;
  readAt?: string | null;
}

export interface NotificationInput {
  timestamp?: string;
  importance?: number;
  message: string;
}

// ── Changelog ──

export interface ChangelogEntry {
  id: number;
  version: string;
  gitCommit: string;
  gitCommitShort: string;
  gitBranch: string | null;
  deployedAt: string | null;
  source: string | null;
  changelog: string;
  changeCount: number;
  releaseType: "major" | "minor" | "patch";
}

export interface ChangelogPage {
  data: ChangelogEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface AdminChangelogInput {
  changelog: string;
}

export interface SiteVersionComponent {
  id: number;
  component: string;
  environment: string;
  version: string;
  gitCommit: string;
  gitCommitShort: string;
  gitBranch: string;
  gitDirty: boolean;
  buildTimestamp: string | null;
  deployedAt: string | null;
  dbSchemaVersion: string;
  source: string;
  metadata: Record<string, unknown>;
}

export interface SiteVersion extends SiteVersionComponent {
  timestamp: string | null;
  notes?: string;
  components: SiteVersionComponent[];
}

export interface TierStat {
  tier: string;
  tierSort: number;
  totalPlays: number;
  avgWinRate: number;
  percentage: number;
}

export interface TierSummary {
  profilePlayers: number;
  avgProfileTier: number;
  matchPlayerRows: number;
  activePlayers: number;
  rankedMatches: number;
  avgParticipationTier: number;
  avgMatchTier: number;
  medianMatchTier: number;
}

// ── Fetch helpers ──

/**
 * Default fetch timeout (ms). Without it, a stalled backend connection causes the
 * frontend to wait indefinitely — especially bad on mobile/slow networks.
 * Most reads use 10 seconds; operations that intentionally wait for durable
 * pipeline completion can opt into a longer request-scoped timeout.
 */
const FETCH_TIMEOUT_MS = 10000;


// User-facing error keys — resolved at the UI layer via t()
export const API_ERROR_KEYS = {
  genericFailure: "generated.api.genericFailure",
  unexpectedFetchFailure: "generated.api.unexpectedFetchFailure",
  notAuthenticated: "generated.api.notAuthenticated",
  authenticationRequired: "generated.api.authenticationRequired",
} as const;

export type ApiErrorKey = (typeof API_ERROR_KEYS)[keyof typeof API_ERROR_KEYS];

export function isApiErrorKey(value: unknown): value is ApiErrorKey {
  return typeof value === "string"
    && (Object.values(API_ERROR_KEYS) as string[]).includes(value);
}

async function fetchJson<T>(path: string, options?: RequestInit & { retries?: number; unwrapData?: boolean; timeoutMs?: number }): Promise<T> {
  const retries = options?.retries ?? 2;
  const unwrapData = options?.unwrapData ?? true;
  const timeoutMs = options?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const fetchOptions: RequestInit = { ...options };
  delete (fetchOptions as any).retries;
  delete (fetchOptions as any).unwrapData;
  delete (fetchOptions as any).timeoutMs;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // CRITICAL: Add timeout to prevent indefinite hang on stalled backend.
    // AbortSignal.timeout() cancels the fetch if it exceeds the limit.
    // Source: Fault #1 — "No timeout on fetch()"
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const scopedPath = withStoredLobbyTier(path);
    const res = await fetch(`${API_BASE}${scopedPath}`, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      const errBody = await res.json().catch(() => null);
      const message = typeof errBody?.error === "string" ? errBody.error : errBody?.error?.message;
      // Expected client errors are intentionally written by the backend for the
      // person making the request (validation, conflicts, rate limits, and so on).
      // Preserve them instead of collapsing every response into a generic key.
      if (res.status < 500 && typeof message === "string" && message.trim()) {
        throw new ApiRequestError(message.trim(), res.status);
      }
      throw new ApiRequestError(API_ERROR_KEYS.genericFailure, res.status);
    }
    const json = await res.json();
    // Handle normalized list envelopes when callers only need the rows.
    if (unwrapData && json && json.data !== undefined) {
      return json.data as T;
    }
    return json as T;
  }
  throw new Error(API_ERROR_KEYS.unexpectedFetchFailure);
}

function numberOrNull(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

function toDisplayPercent(value: number | string | null | undefined): number | null {
  const parsed = numberOrNull(value);
  if (parsed == null) return null;
  return Math.abs(parsed) <= 1 ? Number((parsed * 100).toFixed(2)) : parsed;
}

function splitRoles(roles: unknown): string[] | null {
  if (Array.isArray(roles)) return roles.map(String).filter(Boolean);
  if (typeof roles === 'string') return roles.split(',').map((s) => s.trim()).filter(Boolean);
  return null;
}

// ── System ──

export async function fetchDatabaseStats(): Promise<DatabaseStats | null> {
  try {
    const raw = await fetchJson<{
      tables: Array<{ name: string; row_count: number | string }>;
      timestamp: string;
    }>(`/database`);
    return {
      tables: raw.tables.map((table) => ({
        name: table.name,
        rowCount: Number(table.row_count ?? 0),
      })),
      timestamp: raw.timestamp,
    };
  } catch {
    return null;
  }
}

export async function fetchSystemStatus(): Promise<SystemStatus | null> {
  try {
    const raw = await fetchJson<{
      matches: number | string;
      players: number | string;
      pendingPulls?: number | string;
      lastMatch?: string | null;
      timestamp: string;
    }>(`/status`);
    return {
      matches: Number(raw.matches ?? 0),
      players: Number(raw.players ?? 0),
      pendingPulls: Number(raw.pendingPulls ?? 0),
      lastMatch: raw.lastMatch ?? null,
      timestamp: raw.timestamp,
    };
  } catch {
    return null;
  }
}

export async function fetchHirezServiceStatus(): Promise<HirezServiceStatus | null> {
  try {
    const raw = await fetchJson<HirezServiceStatus>(`/system/hirez-status`, { retries: 0, unwrapData: false });
    return {
      ...raw,
      activeOutages: Array.isArray(raw.activeOutages) ? raw.activeOutages : [],
      recentSignals: Array.isArray(raw.recentSignals) ? raw.recentSignals : [],
      pendingVendorDebt: Number(raw.pendingVendorDebt || 0),
      dueVendorDebt: Number(raw.dueVendorDebt || 0),
      affectedHours: Number(raw.affectedHours || 0),
      signalLookbackMinutes: Number(raw.signalLookbackMinutes || 0),
    };
  } catch {
    return null;
  }
}

function mapNotification(raw: {
  id: number;
  timestamp?: string;
  importance?: number | string;
  message: string;
  read_at?: string | null;
}): Notification {
  return {
    id: raw.id,
    timestamp: raw.timestamp ?? "",
    importance: Number(raw.importance ?? 0),
    message: raw.message,
    readAt: raw.read_at,
  };
}

class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function isAuthenticationRejection(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

// ── Notifications ──

export async function fetchNotifications(params?: { limit?: number }): Promise<Notification[]> {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set('limit', String(params.limit));
  try {
    const raw = await fetchJson<any[]>(`/notifications${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map(mapNotification);
  } catch {
    return [];
  }
}

export async function fetchAccountSiteNotifications(params?: { limit?: number }): Promise<Notification[]> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const limit = params?.limit ?? 8;
  const rows = await fetchJson<Array<{
    id: number; timestamp?: string; importance?: number | string; message: string; read_at?: string | null;
  }>>(`/auth/account/site-notifications?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return rows.map(mapNotification);
}

export async function markSiteNotificationRead(notificationId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  await fetchJson(`/auth/account/site-notifications/${notificationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markAllSiteNotificationsRead(): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  await fetchJson(`/auth/account/site-notifications/read-all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchAdminNotifications(): Promise<Notification[]> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const raw = await fetchJson<any[]>(
    `/admin/notifications`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return raw.map(mapNotification);
}

export async function createAdminNotification(input: NotificationInput): Promise<Notification> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const raw = await fetchJson<any>(`/admin/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return mapNotification(raw);
}

export async function updateAdminNotification(id: number, input: Partial<NotificationInput>): Promise<Notification> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const raw = await fetchJson<any>(`/admin/notifications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return mapNotification(raw);
}

export async function deleteAdminNotification(id: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  await fetchJson<{ deleted: boolean; id: number }>(`/admin/notifications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Changelog ──

export async function fetchChangelogPreview(): Promise<ChangelogEntry | null> {
  try {
    const raw = await fetchJson<any>('/meta/changelog?preview=true', { unwrapData: false });
    return raw ? mapChangelogEntry(raw) : null;
  } catch {
    return null;
  }
}

export async function fetchChangelog(params?: { page?: number; perPage?: number }): Promise<ChangelogPage> {
  const query = new URLSearchParams();
  if (params?.page != null) query.set('page', String(params.page));
  if (params?.perPage != null) query.set('perPage', String(params.perPage));
  try {
    const raw = await fetchJson<any>(`/meta/changelog${query.toString() ? `?${query.toString()}` : ''}`, { unwrapData: false });
    return {
      data: (raw.data ?? []).map(mapChangelogEntry),
      total: raw.total ?? 0,
      page: raw.page ?? 1,
      perPage: raw.perPage ?? 10,
      totalPages: raw.totalPages ?? 1,
    };
  } catch {
    return { data: [], total: 0, page: 1, perPage: 10, totalPages: 1 };
  }
}

export async function fetchAdminChangelog(): Promise<ChangelogEntry[]> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const raw = await fetchJson<any[]>('/admin/changelog', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return raw.map(mapChangelogEntry);
}

export async function updateAdminChangelog(id: number, input: AdminChangelogInput): Promise<ChangelogEntry> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const raw = await fetchJson<any>(`/admin/changelog/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return mapChangelogEntry(raw);
}

function mapChangelogEntry(raw: any): ChangelogEntry {
  const changelog = String(raw?.changelog ?? '');
  const lines = changelog.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const commitLines = lines.filter((line) => /^[0-9a-f]{7,40}\s+\S/i.test(line));
  const fallbackCount = commitLines.length > 0
    ? commitLines.length
    : lines.filter((line) => !/^[-*]?\s*\*\*(added|changed|fixed|removed|refactored|improved|security)\*\*/i.test(line)).length;
  const suppliedCount = raw?.changeCount == null ? Number.NaN : Number(raw.changeCount);
  const changeCount = Number.isInteger(suppliedCount) && suppliedCount >= 0 ? suppliedCount : fallbackCount;
  const releaseType = changeCount >= 10 ? 'major' : changeCount >= 5 ? 'minor' : 'patch';
  return {
    id: Number(raw?.id ?? 0),
    version: String(raw?.version ?? ''),
    gitCommit: String(raw?.gitCommit ?? ''),
    gitCommitShort: String(raw?.gitCommitShort ?? ''),
    gitBranch: raw?.gitBranch ?? null,
    deployedAt: raw?.deployedAt ?? null,
    source: raw?.source ?? null,
    changelog,
    changeCount,
    releaseType,
  };
}

// ── Site Metadata ──

function mapSiteVersionComponent(raw: any): SiteVersionComponent {
  return {
    id: Number(raw?.id ?? 0),
    component: String(raw?.component ?? "stack"),
    environment: String(raw?.environment ?? "unknown"),
    version: String(raw?.version ?? ""),
    gitCommit: String(raw?.gitCommit ?? ""),
    gitCommitShort: String(raw?.gitCommitShort ?? ""),
    gitBranch: String(raw?.gitBranch ?? ""),
    gitDirty: Boolean(raw?.gitDirty),
    buildTimestamp: raw?.buildTimestamp ?? null,
    deployedAt: raw?.deployedAt ?? raw?.timestamp ?? null,
    dbSchemaVersion: String(raw?.dbSchemaVersion ?? ""),
    source: String(raw?.source ?? ""),
    metadata: raw?.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}

export async function fetchSiteVersion(): Promise<SiteVersion | null> {
  try {
    const raw = await fetchJson<any>(`/meta/version`, { retries: 0, cache: "no-store" });
    const mapped = mapSiteVersionComponent(raw);
    return {
      ...mapped,
      timestamp: raw?.timestamp ?? mapped.deployedAt,
      notes: raw?.notes ? String(raw.notes) : undefined,
      components: Array.isArray(raw?.components) ? raw.components.map(mapSiteVersionComponent) : [],
    };
  } catch {
    return null;
  }
}

// ── Champions ──

type ChampionOverviewRaw = {
  champions?: Array<{
    id: number; name: string; roles?: string; title?: string; health?: number; speed?: number; image_path?: string | null;
  }>;
  stats?: any[];
};

let championsOverviewCache: { key: string; value: Champion[]; expiresAt: number } | null = null;
let championsOverviewInFlight: { key: string; promise: Promise<Champion[]> } | null = null;

function mapChampionsOverview(raw: ChampionOverviewRaw): Champion[] {
  const catalog = raw.champions ?? [];
  const stats = mapStatsChampionRows(raw.stats ?? []);
  const statsById = new Map(stats.map((stat) => [stat.championId, stat]));
  const statsByName = new Map(stats.map((stat) => [stat.championName.toLowerCase(), stat]));
  const statsBySlug = new Map(stats.map((stat) => [championSlug(stat.championName), stat]));

  return catalog.map((r): Champion => {
    const stat =
      statsById.get(r.id) ??
      statsByName.get(r.name.toLowerCase()) ??
      statsBySlug.get(championSlug(r.name));

    return {
      id: r.id,
      name: r.name,
      roles: splitRoles(r.roles),
      winRate: stat?.winRate ?? null,
      pickRate: stat?.pickRate ?? null,
      banRate: stat?.banRate ?? null,
      totalBans: stat?.totalBans ?? null,
      rating: stat?.avgLeagueTier ?? null,
      ratingDeviation: null,
      volatility: null,
      totalMatches: stat?.totalPlays ?? null,
      totalPlays: stat?.totalPlays ?? null,
      wins: null,
      imagePath: r.image_path || null,
    };
  });
}

export type PublicStatsScope =
  | 'ranked'
  | 'casual'
  | 'bot'
  | 'team_deathmatch'
  | 'arcade'
  | 'wave_defense'
  | 'experiment'
  | 'newcomer';

export async function fetchChampions(params?: {
  limit?: string;
  offset?: string;
  tier?: string;
  region?: string;
  patch?: string;
  scope?: PublicStatsScope;
}): Promise<Champion[]> {
  const statsScope = params?.scope ?? 'ranked';
  const cacheKey = `${statsScope}|${statsScope === 'ranked' ? getStoredLobbyTierFilter() : ''}`;
  if (championsOverviewCache?.key === cacheKey && championsOverviewCache.expiresAt > Date.now()) return championsOverviewCache.value;
  if (championsOverviewInFlight?.key === cacheKey) return championsOverviewInFlight.promise;
  const promise = fetchJson<ChampionOverviewRaw>(`/champions/overview?scope=${encodeURIComponent(statsScope)}`, { unwrapData: false })
    .then((raw) => {
      const value = mapChampionsOverview(raw);
      championsOverviewCache = { key: cacheKey, value, expiresAt: Date.now() + 300_000 };
      return value;
    });
  championsOverviewInFlight = { key: cacheKey, promise };
  try {
    return await promise;
  } finally {
    if (championsOverviewInFlight?.promise === promise) championsOverviewInFlight = null;
  }
}

export async function fetchTopWinrate(): Promise<TopWinrateEntry[]> {
  const res = await fetch(`${API_BASE}${withStoredLobbyTier('/champions/top-winrate')}`);
  if (!res.ok) return [];
  // Backend returns a bare array, not wrapped in { value: [...] }
  return (await res.json()) as TopWinrateEntry[];
}

export async function fetchChampionDetail(id: number): Promise<ChampionDetail> {
  const raw = await fetchJson<{
    id: number;
    name: string;
    class: string | null;
    cost: number | null;
    description: string | null;
    stats: Record<string, unknown> | null;
    ratings: { rating: number; deviation: number; volatility: number } | null;
    total_plays: number | null;
    total_matches: number | null;
    wins: number | null;
    tier_stats: Array<{ tier: string; win_rate: number; pick_rate: number; total_plays: number }>;
    patch_trends: Array<{ trend_week: string; weekly_win_rate: number; weekly_plays: number }>;
  }>(`/champions/${id}`);

  return {
    id: raw.id,
    name: raw.name,
    class: raw.class,
    cost: raw.cost,
    description: raw.description,
    stats: raw.stats,
    ratings: raw.ratings,
    totalPlays: raw.total_plays ?? null,
    totalMatches: raw.total_matches ?? null,
    wins: raw.wins ?? null,
    tierStats: raw.tier_stats.map((t) => ({
      tier: t.tier,
      winRate: t.win_rate,
      pickRate: t.pick_rate,
      totalPlays: t.total_plays,
    })),
    patchTrends: raw.patch_trends.map((t) => ({
      trendWeek: t.trend_week,
      weeklyWinRate: t.weekly_win_rate,
      weeklyPlays: t.weekly_plays,
    })),
  };
}

export async function fetchChampionTierStats(id: number): Promise<TierStats[]> {
  const raw = await fetchJson<Array<{
    tier: string;
    win_rate: number;
    pick_rate: number;
    total_plays: number;
  }>>(`/champions/${id}/tier-stats`);

  return raw.map((r) => ({
    tier: r.tier,
    winRate: r.win_rate,
    pickRate: r.pick_rate,
    totalPlays: r.total_plays,
  }));
}

export async function fetchChampionPatchTrends(id: number): Promise<PatchTrend[]> {
  const raw = await fetchJson<Array<{
    trend_week: string;
    weekly_win_rate: number;
    weekly_plays: number;
  }>>(`/champions/${id}/patch-trends`);

  return raw.map((r) => ({
    trendWeek: r.trend_week,
    weeklyWinRate: r.weekly_win_rate,
    weeklyPlays: r.weekly_plays,
  }));
}

export async function fetchChampionCounters(id: number): Promise<CounterStats> {
  const raw = await fetchJson<{
    strong_against: Array<{ opponent_champion_name: string; opponent_champion_id: number; wins: number; total_matches: number; win_rate: number }>;
    weak_against: Array<{ opponent_champion_name: string; opponent_champion_id: number; wins: number; total_matches: number; win_rate: number }>;
  }>(`/champions/${id}/counters`);

  return {
    strongAgainst: raw.strong_against.map((c) => ({
      opponentChampionName: c.opponent_champion_name,
      opponentChampionId: c.opponent_champion_id,
      wins: c.wins,
      totalMatches: c.total_matches,
      winRate: c.win_rate,
    })),
    weakAgainst: raw.weak_against.map((c) => ({
      opponentChampionName: c.opponent_champion_name,
      opponentChampionId: c.opponent_champion_id,
      wins: c.wins,
      totalMatches: c.total_matches,
      winRate: c.win_rate,
    })),
  };
}

// ── Players ──

export async function fetchPlayerProfile(id: string, queueId?: number, championId?: number): Promise<PlayerProfile & { level?: number | null; kbmRank?: number | null; queueElo?: number | null; championElo?: number | null; globalWins?: number | null; globalLosses?: number | null; globalWinRate?: number | null; cheater?: boolean; susCount?: number }> {
  type RawChampion = { champion_name: string; champion_id: number; wins: number; total_plays?: number; matches_played?: number; losses?: number; win_rate?: number | null; mu?: number | string | null };
  type RawPlayer = {
    id: string | number; name: string; level?: number | string | null; platform?: string | null; region?: string | null;
    kbm_tier?: string | number | null; kbm_points?: number | string | null; kbm_rank?: number | string | null;
    total_matches?: number | string | null; total_wins?: number | string | null;
    wins?: number | string | null; losses?: number | string | null;
    cheater?: boolean | null; sus_count?: number | string | null;
    win_rate?: number | string | null; total_plays?: number | string | null;
    top_champions?: RawChampion[] | null;
  };
  type QueueRating = { queue_id?: number | string; mu?: number | string | null };
  type ProfileResponse = RawPlayer | { player: RawPlayer; championRatings?: RawChampion[] | null; queueRatings?: QueueRating[] | null };
  const raw = await fetchJson<ProfileResponse>(`/players/${id}`);
  // The current backend wraps profile data in { player, championRatings }.
  // Accept the legacy flat shape too, so cached/older deployments remain usable.
  const response = "player" in raw ? raw : null;
  const player = response?.player ?? raw as RawPlayer;
  const champions = response?.championRatings ?? player.top_champions ?? [];
  const numberOrNull = (value: number | string | null | undefined) => {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const totalMatches = numberOrNull(player.total_matches) ?? numberOrNull(player.total_plays) ?? ((numberOrNull(player.wins) ?? 0) + (numberOrNull(player.losses) ?? 0));
  const totalWins = numberOrNull(player.total_wins) ?? numberOrNull(player.wins) ?? 0;
  const reportedWinRate = numberOrNull(player.win_rate);
  const queueRatings = response?.queueRatings ?? [];
  const requestedQueueRating = queueRatings.find((rating) => Number(rating.queue_id) === queueId)
    ?? queueRatings.find((rating) => Number(rating.queue_id) === 486)
    ?? queueRatings[0];
  const selectedChampionRating = champions.find((rating) => Number(rating.champion_id) === championId);
  const globalWins = numberOrNull(player.wins);
  const globalLosses = numberOrNull(player.losses);

  return {
    id: String(player.id),
    name: player.name,
    level: numberOrNull(player.level),
    platform: player.platform ?? null,
    region: player.region ?? null,
    kbmTier: player.kbm_tier == null ? null : String(player.kbm_tier),
    kbmPoints: numberOrNull(player.kbm_points),
    kbmRank: numberOrNull(player.kbm_rank),
    queueElo: numberOrNull(requestedQueueRating?.mu),
    championElo: numberOrNull(selectedChampionRating?.mu),
    globalWins,
    globalLosses,
    globalWinRate: globalWins != null && globalLosses != null && globalWins + globalLosses > 0
      ? (globalWins / (globalWins + globalLosses)) * 100
      : null,
    cheater: Boolean(player.cheater),
    susCount: numberOrNull(player.sus_count) ?? 0,
    totalMatches,
    totalWins,
    winRate: reportedWinRate ?? (totalMatches > 0 ? (totalWins / totalMatches) * 100 : null),
    totalPlays: numberOrNull(player.total_plays) ?? totalMatches,
    topChampions: champions.map((c) => {
      const plays = numberOrNull(c.total_plays) ?? numberOrNull(c.matches_played) ?? 0;
      const wins = numberOrNull(c.wins) ?? 0;
      return {
      championName: c.champion_name,
      championId: c.champion_id,
      wins,
      totalPlays: plays,
      winRate: numberOrNull(c.win_rate) ?? (plays > 0 ? (wins / plays) * 100 : 0),
    };
    }),
  };
}

export interface PlayerChampionStat {
  championId: number;
  championName: string;
  role: string;
  xp: number;
  ownershipType: string;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  minutesPlayed: number;
  matchesPlayed: number;
  winRate: number | null;
  lastUpdated: string | null;
}

export async function fetchPlayerChampionStats(playerId: string | number): Promise<PlayerChampionStat[]> {
  type RawStat = {
    champion_id: number | string;
    champion_name: string;
    role: string;
    xp?: number | string | null;
    ownership_type?: string | null;
    wins?: number | string | null;
    losses?: number | string | null;
    kills?: number | string | null;
    deaths?: number | string | null;
    assists?: number | string | null;
    minutes_played?: number | string | null;
    matches_played?: number | string | null;
    win_rate?: number | string | null;
    last_updated?: string | null;
  };
  const raw = await fetchJson<RawStat[]>(`/players/${playerId}/champions`);
  const numberOrZero = (value: number | string | null | undefined) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const numberOrNull = (value: number | string | null | undefined) => {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return raw.map((stat) => ({
    championId: numberOrZero(stat.champion_id),
    championName: stat.champion_name,
    role: stat.role,
    xp: numberOrZero(stat.xp),
    ownershipType: stat.ownership_type ?? "",
    wins: numberOrZero(stat.wins),
    losses: numberOrZero(stat.losses),
    kills: numberOrZero(stat.kills),
    deaths: numberOrZero(stat.deaths),
    assists: numberOrZero(stat.assists),
    minutesPlayed: numberOrZero(stat.minutes_played),
    matchesPlayed: numberOrZero(stat.matches_played),
    winRate: numberOrNull(stat.win_rate),
    lastUpdated: stat.last_updated ?? null,
  }));
}

export interface PlayerChampionStatsRefreshResponse {
  refreshed: boolean;
  freshness: {
    remaining_seconds: number;
  };
}

export async function refreshPlayerChampionStats(playerId: string | number): Promise<PlayerChampionStatsRefreshResponse> {
  return fetchJson<PlayerChampionStatsRefreshResponse>(`/players/${playerId}/champions/refresh`, { method: "POST" });
}

export interface ItemDimensionStat {
  slot?: number;
  level?: number;
  totalUses: number;
  wins: number;
  losses: number;
  winRate: number;
  pickRate?: number;
}

export interface ItemDetailStats {
  itemId: number;
  itemName: string;
  mode: 'ranked';
  totalUses: number;
  wins: number;
  losses: number;
  winRate: number;
  slots: ItemDimensionStat[];
  levels: ItemDimensionStat[];
  breakdown: ItemDimensionStat[];
}

export async function fetchPlayerSearch(query: string): Promise<PlayerSearchResult[]> {
  const raw = await fetchJson<Array<{
    id: string;
    name: string;
    platform: string;
    region: string;
    kbm_tier: string | null;
  }>>(`/players/search?q=${encodeURIComponent(query)}`);

  return raw.map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform,
    region: r.region,
    kbmTier: r.kbm_tier,
  }));
}

export type UniversalSearchType = "player" | "match" | "champion" | "item" | "card" | "talent";
export type UniversalSearchRemoteTarget = "player-id" | "player-name" | "match-id";

export interface UniversalSearchResult {
  type: UniversalSearchType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  meta?: Record<string, unknown>;
}

export interface UniversalSearchResponse {
  query: string;
  total: number;
  data: UniversalSearchResult[];
  remote?: {
    attempted: boolean;
    target?: UniversalSearchRemoteTarget;
    cacheHit?: boolean;
    skipped?: boolean;
    reason?: string;
    status?: "hit" | "miss" | "error";
    error?: string;
  };
}

export async function fetchUniversalSearch(
  queryText: string,
  limit = 30,
  options?: { remote?: boolean; remoteTarget?: UniversalSearchRemoteTarget; refresh?: boolean },
): Promise<UniversalSearchResponse> {
  const query = new URLSearchParams({
    q: queryText,
    limit: String(limit),
  });
  if (options?.remote) query.set("remote", "true");
  if (options?.remoteTarget) query.set("remoteTarget", options.remoteTarget);
  if (options?.refresh) query.set("refresh", "true");
  return fetchJson<UniversalSearchResponse>(`/search/universal?${query.toString()}`, { unwrapData: false });
}

export async function fetchPlayerMatches(id: string, params?: { limit?: string; offset?: string }): Promise<MatchRecord[]> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<Array<{
    match_id: string;
    champion_name: string;
    win_status: string;
    kills: number;
    deaths: number;
    assists: number;
    damage_done?: number | string;
    damage_per_minute?: number | string | null;
    duration_seconds?: number | string;
    time_in_match?: number | string;
    map?: string;
    queue_id?: number | string | null;
    league_tier?: number | string | null;
    source?: string | null;
    authoritative?: boolean;
    entry_datetime: string;
  }>>(`/players/${id}/matches${query.toString() ? `?${query.toString()}` : ''}`);

  // Transitional storage can expose the same match through more than one
  // authoritative table. Preserve the newest API ordering and render it once.
  const uniqueMatches = [...new Map(raw.map((match) => [String(match.match_id), match])).values()];

  return uniqueMatches.map((m) => ({
    matchId: m.match_id,
    championName: m.champion_name,
    isWinner: ['winner', 'win'].includes(String(m.win_status ?? '').toLowerCase()),
    kills: Number(m.kills ?? 0),
    deaths: Number(m.deaths ?? 0),
    assists: Number(m.assists ?? 0),
    damageDone: Number(m.damage_done ?? 0),
    duration: Number(m.duration_seconds ?? m.time_in_match ?? 0),
    mapGame: String(m.map ?? 'Unknown'),
    entryDatetime: m.entry_datetime,
    queueId: m.queue_id == null ? null : Number(m.queue_id),
    leagueTier: m.league_tier == null ? null : Number(m.league_tier),
    source: m.source ?? null,
    authoritative: m.authoritative === true,
  }));
}

export interface PlayerLoadoutFreshness {
  ttlSeconds: number;
  refreshedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number;
  expired: boolean;
  manualRefreshAvailableAt: string | null;
  manualRefreshRemainingSeconds: number;
}

export interface PlayerLoadout {
  id: number;
  deckId: number | null;
  deckKey: string;
  championId: number;
  championName: string;
  loadoutName: string;
  cardIds: number[];
  cardLevels: number[];
  talentId: number | null;
  fetchedAt: string;
  updatedAt: string;
}

export interface PlayerLoadoutsResponse {
  loadouts: PlayerLoadout[];
  freshness: PlayerLoadoutFreshness;
  refreshed: boolean;
  refreshError: string | null;
}

function mapPlayerLoadoutFreshness(raw: any): PlayerLoadoutFreshness {
  return {
    ttlSeconds: Number(raw?.ttl_seconds ?? 86_400),
    refreshedAt: raw?.refreshed_at ?? null,
    expiresAt: raw?.expires_at ?? null,
    remainingSeconds: Number(raw?.remaining_seconds ?? 0),
    expired: raw?.expired !== false,
    manualRefreshAvailableAt: raw?.manual_refresh_available_at ?? null,
    manualRefreshRemainingSeconds: Number(raw?.manual_refresh_remaining_seconds ?? 0),
  };
}

function mapPlayerLoadout(raw: any): PlayerLoadout {
  return {
    id: Number(raw.id),
    deckId: raw.deck_id == null ? null : Number(raw.deck_id),
    deckKey: String(raw.deck_key ?? ""),
    championId: Number(raw.champion_id),
    championName: String(raw.champion_name ?? `Champion ${raw.champion_id}`),
    loadoutName: String(raw.loadout_name ?? "Unnamed Loadout"),
    cardIds: Array.isArray(raw.card_ids) ? raw.card_ids.map(Number) : [],
    cardLevels: Array.isArray(raw.card_levels) ? raw.card_levels.map(Number) : [],
    talentId: raw.talent_id == null ? null : Number(raw.talent_id),
    fetchedAt: String(raw.fetched_at ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
  };
}

export async function fetchPlayerLoadouts(playerId: string | number): Promise<PlayerLoadoutsResponse> {
  const raw = await fetchJson<any>(`/players/${playerId}/loadouts`);
  return {
    loadouts: Array.isArray(raw.loadouts) ? raw.loadouts.map(mapPlayerLoadout) : [],
    freshness: mapPlayerLoadoutFreshness(raw.freshness),
    refreshed: raw.refreshed === true,
    refreshError: raw.refresh_error ?? null,
  };
}

export async function refreshPlayerLoadouts(playerId: string | number): Promise<PlayerLoadoutsResponse> {
  const raw = await fetchJson<any>(`/players/${playerId}/loadouts/refresh`, { method: "POST" });
  return {
    loadouts: Array.isArray(raw.loadouts) ? raw.loadouts.map(mapPlayerLoadout) : [],
    freshness: mapPlayerLoadoutFreshness(raw.freshness),
    refreshed: raw.refreshed === true,
    refreshError: raw.refresh_error ?? null,
  };
}

export async function fetchPlayerLoadoutDeck(playerId: string | number, loadoutId: string | number): Promise<{ loadout: PlayerLoadout; freshness: PlayerLoadoutFreshness }> {
  const raw = await fetchJson<any>(`/players/${playerId}/loadouts/decks/${loadoutId}`);
  return { loadout: mapPlayerLoadout(raw.loadout), freshness: mapPlayerLoadoutFreshness(raw.freshness) };
}

// ── Stats ──

export async function fetchLeaderboard(params?: { tier?: string; region?: string }): Promise<LeaderboardEntry[]> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<Array<{
    rank: number;
    championId: number;
    championName: string;
    winRate: number;
    totalPlays: number | string;
  }>>(`/stats/leaderboard${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r) => ({
    championId: r.championId,
    championName: r.championName,
    winRate: r.winRate,
    totalPlays: typeof r.totalPlays === 'string' ? Number(r.totalPlays) : (r.totalPlays ?? 0),
    rating: null,
  }));
}

export async function fetchPatchTrends(params?: { champion_id?: string }): Promise<PatchTrendEntry[]> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<Array<{
    trend_week: string;
    patch_version: string;
    champion_id: number;
    champion_name: string;
    weekly_win_rate: number;
    weekly_plays: number;
  }>>(`/stats/patch-trends${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r) => ({
    trendWeek: r.trend_week,
    patchVersion: r.patch_version,
    championId: r.champion_id,
    championName: r.champion_name,
    weeklyWinRate: r.weekly_win_rate,
    weeklyPlays: r.weekly_plays,
  }));
}

export interface StatsChampion {
  championId: number;
  championName: string;
  winRate: number;
  totalPlays: number;
  banRate?: number;
  totalBans?: number;
  pickRate?: number;
  kda?: number;
  avgDamage?: number;
  avgCredits?: number;
  avgHeal?: number;
  avgShielding?: number;
  avgLeagueTier?: number;
}

function mapStatsChampionRows(raw: Array<{
  champion_id: number; champion_name: string;
  win_rate: number | string; total_matches?: number | string; total_plays?: number | string;
  ban_rate?: number | string; ban_total?: number | string; pick_rate?: number | string; kda?: number | string;
  avg_damage?: number | string; avg_gold?: number | string;
  avg_heal?: number | string; avg_mitigation?: number | string;
  avg_league_tier?: number | string;
}>): StatsChampion[] {
  const num = (v: number | string | undefined) => v != null ? (typeof v === 'string' ? Number(v) : v) : undefined;
  return raw.map((r) => ({
    championId: r.champion_id,
    championName: r.champion_name,
    winRate: toDisplayPercent(r.win_rate) ?? 0,
    totalPlays: num(r.total_matches) ?? num(r.total_plays) ?? 0,
    banRate: toDisplayPercent(r.ban_rate) ?? undefined,
    totalBans: num(r.ban_total) ?? 0,
    pickRate: toDisplayPercent(r.pick_rate) ?? undefined,
    kda: num(r.kda),
    avgDamage: num(r.avg_damage),
    avgCredits: num(r.avg_gold),
    avgHeal: num(r.avg_heal),
    avgShielding: num(r.avg_mitigation),
    avgLeagueTier: num(r.avg_league_tier),
  }));
}

export async function fetchStatsChampions(params?: { sort?: string; limit?: number; scope?: PublicStatsScope; queueId?: number }): Promise<StatsChampion[]> {
  const query = new URLSearchParams();
  if (params?.sort) query.set('sort', params.sort);
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.scope) query.set('scope', params.scope);
  if (params?.queueId != null) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Array<{
      champion_id: number; champion_name: string;
      win_rate: number | string; total_matches?: number | string; total_plays?: number | string;
      ban_rate?: number | string; ban_total?: number | string; pick_rate?: number | string; kda?: number | string;
      avg_damage?: number | string; avg_gold?: number | string;
      avg_heal?: number | string; avg_mitigation?: number | string;
      avg_league_tier?: number | string;
    }>>(`/stats/champions${query.toString() ? `?${query.toString()}` : ''}`);
    return mapStatsChampionRows(raw);
  } catch {
    return [];
  }
}

export async function fetchRegions(): Promise<RegionStat[]> {
  const raw = await fetchJson<Array<{
    region_code: string;
    region_name: string;
    continent: string;
    avg_duration: number;
    top_champions: Array<{ champion_name: string; champion_id: number; wins: number; total_plays: number; win_rate: number }>;
  }>>(`/stats/regions`);

  return raw.map((r) => ({
    regionCode: r.region_code,
    regionName: r.region_name,
    continent: r.continent,
    avgDuration: r.avg_duration,
    topChampions: r.top_champions.map((c) => ({
      championName: c.champion_name,
      championId: c.champion_id,
      wins: c.wins,
      totalPlays: c.total_plays,
      winRate: c.win_rate,
    })),
  }));
}

export async function fetchPlatforms(): Promise<Array<{
  platform: string;
  championId: number;
  championName: string;
  totalMatches: number;
  winRate: number;
  avgDpm: number;
  avgHpm: number;
}>> {
  const raw = await fetchJson<Array<{
    platform: string;
    champion_id: number | string;
    champion_name: string;
    total_matches: number | string;
    win_rate: number | string;
    avg_dpm: number | string;
    avg_hpm: number | string;
  }>>(`/stats/platforms`);

  return raw.map((r) => ({
    platform: r.platform,
    championId: numberOrNull(r.champion_id) ?? 0,
    championName: r.champion_name,
    totalMatches: numberOrNull(r.total_matches) ?? 0,
    winRate: toDisplayPercent(r.win_rate) ?? 0,
    avgDpm: numberOrNull(r.avg_dpm) ?? 0,
    avgHpm: numberOrNull(r.avg_hpm) ?? 0,
  }));
}

export async function fetchLoadouts(params?: {
  championId?: string;
  minPlays?: string;
  limit?: string;
  offset?: string;
}): Promise<LoadoutStat[]> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<Array<{
    deck_hash: string;
    champion_id: number | string;
    champion_name: string;
    total_matches: number | string;
    total_uses: number | string;
    wins: number | string;
    losses: number | string;
    win_rate: number | string;
    ranked_wins: number | string;
    ranked_win_rate: number | string;
    high_tier_wins: number | string;
    high_tier_win_rate: number | string;
    avg_kills: number | string;
    avg_deaths: number | string;
    avg_assists: number | string;
    avg_dpm: number | string;
    avg_hpm: number | string;
    loadout_items: Array<{ item_name: string; usage_rate: number | string }> | null;
    last_refreshed: string;
  }>>(`/stats/loadouts${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r) => ({
    deckHash: r.deck_hash,
    championId: numberOrNull(r.champion_id) ?? 0,
    championName: r.champion_name,
    totalMatches: numberOrNull(r.total_matches) ?? 0,
    totalUses: numberOrNull(r.total_uses) ?? 0,
    wins: numberOrNull(r.wins) ?? 0,
    losses: numberOrNull(r.losses) ?? 0,
    winRate: toDisplayPercent(r.win_rate) ?? 0,
    rankedWins: numberOrNull(r.ranked_wins) ?? 0,
    rankedWinRate: toDisplayPercent(r.ranked_win_rate) ?? 0,
    highTierWins: numberOrNull(r.high_tier_wins) ?? 0,
    highTierWinRate: toDisplayPercent(r.high_tier_win_rate) ?? 0,
    avgKills: numberOrNull(r.avg_kills) ?? 0,
    avgDeaths: numberOrNull(r.avg_deaths) ?? 0,
    avgAssists: numberOrNull(r.avg_assists) ?? 0,
    avgDpm: numberOrNull(r.avg_dpm) ?? 0,
    avgHpm: numberOrNull(r.avg_hpm) ?? 0,
    loadoutItems: r.loadout_items?.map((item) => ({
      item_name: item.item_name,
      usage_rate: numberOrNull(item.usage_rate) ?? 0,
    })) ?? null,
    lastRefreshed: r.last_refreshed,
  }));
}

export async function fetchItems(params?: { mode?: 'ranked' | 'casual'; limit?: number; championId?: number; role?: 'Frontline' | 'Damage' | 'Flank' | 'Support'; summary?: boolean; tierMin?: number; tierMax?: number; scope?: string; queueId?: number }): Promise<ItemStat[]> {
  const query = new URLSearchParams();
  if (params?.mode) query.set('mode', params.mode);
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.championId != null) query.set('championId', String(params.championId));
  if (params?.role) query.set('role', params.role);
  if (params?.summary) query.set('summary', 'true');
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  if (params?.scope) query.set('scope', params.scope);
  if (params?.queueId != null) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Array<{
      item_id: number; item_name: string;
      total_uses?: number | string; total_usage?: number | string;
      win_rate: number | string;
      pick_rate?: number | string;
      slots?: Array<{ slot: number | string; total_uses: number | string; win_rate: number | string }>;
      levels?: Array<{ item_level: number | string; total_uses: number | string; win_rate: number | string }>;
      breakdown?: Array<{ slot: number | string; item_level: number | string; total_uses: number | string; win_rate: number | string; pick_rate?: number | string }>;
    }>>(`/stats/items${query.toString() ? `?${query.toString()}` : ''}`);
    const num = (v: number | string | undefined) => v != null ? (typeof v === 'string' ? Number(v) : v) : 0;
    return raw.map((r) => ({
      itemId: r.item_id,
      itemName: r.item_name,
      totalUsage: num(r.total_uses) || num(r.total_usage),
      winRate: num(r.win_rate),
      pickRate: r.pick_rate == null ? undefined : num(r.pick_rate),
      slots: (r.slots ?? []).map((slot) => ({
        slot: num(slot.slot), totalUses: num(slot.total_uses), wins: 0, losses: 0, winRate: num(slot.win_rate),
      })),
      levels: (r.levels ?? []).map((level) => ({
        level: num(level.item_level), totalUses: num(level.total_uses), wins: 0, losses: 0, winRate: num(level.win_rate),
      })),
      breakdown: (r.breakdown ?? []).map((row) => ({
        slot: num(row.slot), level: num(row.item_level), totalUses: num(row.total_uses), wins: 0, losses: 0, winRate: num(row.win_rate),
        pickRate: row.pick_rate == null ? undefined : num(row.pick_rate),
      })),
    }));
  } catch {
    return [];
  }
}

export async function fetchItemDetail(itemId: number, mode: 'ranked' = 'ranked', params?: { championId?: number; role?: 'Frontline' | 'Damage' | 'Flank' | 'Support'; tierMin?: number; tierMax?: number }): Promise<ItemDetailStats | null> {
  try {
    const query = new URLSearchParams({ mode });
    if (params?.championId != null) query.set('championId', String(params.championId));
    if (params?.role) query.set('role', params.role);
    if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
    if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
    const raw = await fetchJson<any>(`/stats/items/${itemId}?${query.toString()}`);
    const number = (value: unknown) => Number(value ?? 0);
    const dimension = (row: any): ItemDimensionStat => ({
      slot: row.slot == null ? undefined : number(row.slot),
      level: row.item_level == null ? undefined : number(row.item_level),
      totalUses: number(row.total_uses),
      wins: number(row.wins),
      losses: number(row.losses),
      winRate: number(row.win_rate),
    });
    return {
      itemId: number(raw.item_id),
      itemName: raw.item_name ?? 'Unknown item',
      mode: 'ranked',
      totalUses: number(raw.total_uses),
      wins: number(raw.wins),
      losses: number(raw.losses),
      winRate: number(raw.win_rate),
      slots: (raw.slots ?? []).map(dimension),
      levels: (raw.levels ?? []).map(dimension),
      breakdown: (raw.breakdown ?? []).map(dimension),
    };
  } catch {
    return null;
  }
}

export async function fetchMapStats(params?: { queueId?: number; limit?: number; scope?: PublicStatsScope }): Promise<MapStat[]> {
  const query = new URLSearchParams();
  if (params?.queueId != null) query.set('queueId', String(params.queueId));
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.scope) query.set('scope', params.scope);
  try {
    const raw = await fetchJson<Array<{
      map: string;
      total_matches: number | string;
      distribution_rate: number | string;
      avg_duration_seconds: number | string;
    }>>(`/stats/maps${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map((r) => ({
      name: r.map,
      totalMatches: Number(r.total_matches ?? 0),
      distributionRate: Number(r.distribution_rate ?? 0),
      avgDurationSeconds: Number(r.avg_duration_seconds ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchChampionMapStats(championId: number, params?: { scope?: PublicStatsScope; queueId?: number }): Promise<ChampionMapStat[]> {
  try {
    const query = new URLSearchParams();
    if (params?.scope) query.set('scope', params.scope);
    if (params?.queueId != null) query.set('queueId', String(params.queueId));
    const raw = await fetchJson<Array<{
      map: string;
      total_plays: number | string;
      wins: number | string;
      losses: number | string;
      win_rate: number | string;
      pick_rate: number | string;
    }>>(`/stats/champions/${championId}/maps${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map((row) => ({
      name: row.map,
      totalPlays: Number(row.total_plays ?? 0),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      winRate: Number(row.win_rate ?? 0),
      pickRate: Number(row.pick_rate ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function fetchMapDetail(mapName: string, params?: { scope?: PublicStatsScope }): Promise<MapDetailStats | null> {
  try {
    const query = new URLSearchParams();
    if (params?.scope) query.set('scope', params.scope);
    const raw = await fetchJson<any>(`/stats/maps/${encodeURIComponent(mapName)}${query.toString() ? `?${query.toString()}` : ''}`);
    const number = (value: unknown) => Number(value ?? 0);
    const map = raw.map;
    return {
      map: { name: map.map, totalMatches: number(map.total_matches), distributionRate: number(map.distribution_rate), avgDurationSeconds: number(map.avg_duration_seconds) },
      champions: (raw.champions ?? []).map((row: any) => ({ championId: number(row.champion_id), championName: row.champion_name, totalPlays: number(row.total_plays), wins: number(row.wins), losses: number(row.losses), totalBans: row.total_bans == null ? Math.round(number(row.ban_rate) * number(map.total_matches) / 100) : number(row.total_bans), winRate: number(row.win_rate), pickRate: number(row.pick_rate), banRate: number(row.ban_rate) })),
      talents: (raw.talents ?? []).map((row: any) => ({ talentId: number(row.talent_id), talentName: row.talent_name, championId: number(row.champion_id), championName: row.champion_name, totalPlays: number(row.total_plays), wins: number(row.wins), losses: number(row.losses), winRate: number(row.win_rate), pickRate: number(row.pick_rate) })),
      items: (raw.items ?? []).map((row: any) => ({ itemId: number(row.item_id), itemName: row.item_name, totalUses: number(row.total_uses), wins: number(row.wins), losses: number(row.losses), winRate: number(row.win_rate), pickRate: number(row.pick_rate) })),
      compositions: (raw.compositions ?? []).map((row: any) => ({ composition: String(row.comp_id), frontline: number(row.frontline), damage: number(row.damage), flank: number(row.flank), support: number(row.support), totalMatches: number(row.count), wins: number(row.wins), losses: number(row.losses), winRate: number(row.winrate) })),
    };
  } catch {
    return null;
  }
}

export async function fetchMapCategoryComparison(
  mapName: string,
  section: MapComparisonSection,
): Promise<MapCategoryComparisonStat[]> {
  const raw = await fetchJson<any>(`/stats/maps/${encodeURIComponent(mapName)}/comparison?section=${encodeURIComponent(section)}`);
  return (raw.rows ?? []).map((row: any) => ({
    entityKey: String(row.entity_key),
    mapName: String(row.map_name),
    totalCount: Number(row.total_count ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    totalBans: Number(row.total_bans ?? 0),
    winRate: Number(row.win_rate ?? 0),
    pickRate: Number(row.pick_rate ?? 0),
    banRate: Number(row.ban_rate ?? 0),
  }));
}

export interface SkinStat {
  skinId: number;
  skinName: string;
  championId: number;
  championName: string;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
}

export async function fetchSkinStats(params?: { championId?: number; tierMin?: number; tierMax?: number; limit?: number }): Promise<SkinStat[]> {
  const query = new URLSearchParams();
  if (params?.championId != null) query.set('championId', String(params.championId));
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  if (params?.limit != null) query.set('limit', String(params.limit));
  try {
    const raw = await fetchJson<any[]>(`/stats/skins${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map((row) => ({
      skinId: Number(row.skin_id),
      skinName: String(row.skin_name ?? 'Unknown Skin'),
      championId: Number(row.champion_id),
      championName: String(row.champion_name ?? 'Unknown Champion'),
      totalPlays: Number(row.total_plays ?? 0),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      winRate: Number(row.win_rate ?? 0),
    }));
  } catch {
    return [];
  }
}

export interface BrokenSkinStat {
  skinId: number;
  skinName: string;
  championId: number;
  championName: string;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
  usageShare: number;
}

export async function fetchBrokenSkinStats(params?: { championId?: number; tierMin?: number; tierMax?: number }): Promise<BrokenSkinStat[]> {
  const query = new URLSearchParams();
  if (params?.championId != null) query.set('championId', String(params.championId));
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  try {
    const raw = await fetchJson<any[]>(`/stats/broken-skins${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map((row) => ({
      skinId: Number(row.skin_id),
      skinName: String(row.skin_name ?? 'Unknown Skin'),
      championId: Number(row.champion_id),
      championName: String(row.champion_name ?? 'Unknown Champion'),
      totalPlays: Number(row.total_plays ?? 0),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      winRate: Number(row.win_rate ?? 0),
      usageShare: Number(row.usage_share ?? 0),
    }));
  } catch {
    return [];
  }
}

export interface MatchCompositionStat {
  composition: string;
  frontline: number;
  damage: number;
  flank: number;
  support: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export async function fetchMatchCompositions(params?: { tierMin?: number; tierMax?: number; limit?: number; sortBy?: 'count' | 'winrate' | 'wins' | 'frontline' | 'damage' | 'flank' | 'support'; order?: 'asc' | 'desc' }): Promise<MatchCompositionStat[]> {
  const query = new URLSearchParams();
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.order) query.set('order', params.order);
  try {
    const raw = await fetchJson<any[]>(`/matches/compositions${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map((row) => ({
      composition: String(row.comp_id),
      frontline: Number(row.frontline ?? 0),
      damage: Number(row.damage ?? 0),
      flank: Number(row.flank ?? 0),
      support: Number(row.support ?? 0),
      totalMatches: Number(row.count ?? 0),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      winRate: Number(row.winrate ?? 0),
    }));
  } catch {
    return [];
  }
}

export interface ChampionLeaderboardEntry {
  rank: number;
  playerId: number;
  playerName: string;
  mu: number;
  phi: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

export async function fetchChampionLeaderboard(championId: number, limit = 25): Promise<ChampionLeaderboardEntry[]> {
  const query = new URLSearchParams({ championId: String(championId), limit: String(limit) });
  const raw = await fetchJson<Array<{
    rank: number; playerId: number; playerName: string;
    mu: number; phi: number; matchesPlayed: number; wins: number; losses: number;
  }>>(`/stats/champion-leaderboard?${query.toString()}`);
  return raw.map((r) => ({
    rank: r.rank, playerId: r.playerId, playerName: r.playerName,
    mu: r.mu, phi: r.phi, matchesPlayed: r.matchesPlayed, wins: r.wins, losses: r.losses,
  }));
}

// ── Champion Talent Stats ──

export interface ChampionTalentStat {
  talentId: number;
  talentName: string;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface ChampionTalentStatsResponse {
  totalMatches: number;
  talentCoveredMatches: number;
  disconnectedPlayers: number;
  disconnectedWins: number;
  disconnectedLosses: number;
  disconnectedWinRate: number | null;
  talentCoverageRate: number | null;
  talents: ChampionTalentStat[];
}

export function normalizeChampionTalentStatsResponse(raw: any): ChampionTalentStatsResponse {
  return {
    totalMatches: numberOrNull(raw?.totalMatches) ?? 0,
    talentCoveredMatches: numberOrNull(raw?.talentCoveredMatches) ?? 0,
    disconnectedPlayers: numberOrNull(raw?.disconnectedPlayers) ?? 0,
    disconnectedWins: numberOrNull(raw?.disconnectedWins) ?? 0,
    disconnectedLosses: numberOrNull(raw?.disconnectedLosses) ?? 0,
    disconnectedWinRate: toDisplayPercent(raw?.disconnectedWinRate),
    talentCoverageRate: toDisplayPercent(raw?.talentCoverageRate),
    talents: (Array.isArray(raw?.talents) ? raw.talents : []).map((talent: any) => ({
      talentId: numberOrNull(talent?.talentId) ?? 0,
      talentName: String(talent?.talentName ?? 'Unknown'),
      totalPlays: numberOrNull(talent?.totalPlays) ?? 0,
      wins: numberOrNull(talent?.wins) ?? 0,
      losses: numberOrNull(talent?.losses) ?? 0,
      winRate: toDisplayPercent(talent?.winRate) ?? 0,
    })),
  };
}

export async function fetchChampionTalentStats(
  championId: number,
  mode: 'ranked' = 'ranked',
  tier?: { tierMin?: number; tierMax?: number }
): Promise<ChampionTalentStatsResponse> {
  try {
    const query = new URLSearchParams({ mode });
    if (tier?.tierMin != null) query.set('tierMin', String(tier.tierMin));
    if (tier?.tierMax != null) query.set('tierMax', String(tier.tierMax));
    const raw = await fetchJson<{
      totalMatches: number | string;
      talentCoveredMatches?: number | string;
      disconnectedPlayers?: number | string;
      disconnectedWins?: number | string;
      disconnectedLosses?: number | string;
      disconnectedWinRate?: number | string | null;
      talentCoverageRate?: number | string | null;
      talents: Array<{
        talentId: number | string;
        talentName: string;
        totalPlays: number | string;
        wins: number | string;
        losses: number | string;
        winRate: number | string;
      }>;
    }>(`/stats/talents/${championId}?${query.toString()}`);

    return normalizeChampionTalentStatsResponse(raw);
  } catch {
    return { totalMatches: 0, talentCoveredMatches: 0, disconnectedPlayers: 0, disconnectedWins: 0, disconnectedLosses: 0, disconnectedWinRate: null, talentCoverageRate: null, talents: [] };
  }
}

// ── Champion Card Stats ──

export interface ChampionCardLevelStat {
  level: number;
  plays: number;
  winRate: number;
}

export interface ChampionCardStat {
  cardId: number;
  cardName: string;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
  levels: ChampionCardLevelStat[];
}

export interface ChampionCardStatsResponse {
  totalMatches: number;
  cards: ChampionCardStat[];
}

function statNameKeyForCards(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeChampionCardStatsResponse(raw: any): ChampionCardStatsResponse {
  const mappedCards = (Array.isArray(raw?.cards) ? raw.cards : []).map((card: any) => ({
    cardId: numberOrNull(card?.cardId) ?? 0,
    cardName: String(card?.cardName ?? 'Unknown'),
    totalPlays: numberOrNull(card?.totalPlays) ?? 0,
    wins: numberOrNull(card?.wins) ?? 0,
    losses: numberOrNull(card?.losses) ?? 0,
    winRate: toDisplayPercent(card?.winRate) ?? 0,
    levels: (Array.isArray(card?.levels) ? card.levels : []).map((level: any) => ({
      level: numberOrNull(level?.level) ?? 0,
      plays: numberOrNull(level?.plays) ?? 0,
      winRate: toDisplayPercent(level?.winRate) ?? 0,
    })),
  }));
  const dedupedByName = new Map<string, ChampionCardStat>();
  for (const card of mappedCards) {
    const key = statNameKeyForCards(card.cardName);
    const existing = dedupedByName.get(key);
    if (!existing || card.totalPlays > existing.totalPlays) dedupedByName.set(key, card);
  }

  return {
    totalMatches: numberOrNull(raw?.totalMatches) ?? 0,
    cards: Array.from(dedupedByName.values()).sort((a, b) => {
      const playsDelta = b.totalPlays - a.totalPlays;
      return playsDelta !== 0 ? playsDelta : a.cardName.localeCompare(b.cardName);
    }),
  };
}
export interface ChampionCardTalentStat {
  talentId: number;
  talentName: string;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface ChampionCardDetailResponse {
  cardId: number;
  cardName: string;
  championId: number;
  championName: string;
  mode: 'ranked';
  talentId: number | null;
  totalPlays: number;
  wins: number;
  losses: number;
  winRate: number;
  levels: ChampionCardLevelStat[];
  talents: ChampionCardTalentStat[];
}


export async function fetchChampionCardDetail(
  championId: number,
  cardId: number,
  mode: 'ranked' = 'ranked',
  talentId?: number | null
): Promise<ChampionCardDetailResponse | null> {
  try {
    const raw = await fetchJson<ChampionCardDetailResponse>(
      `/stats/cards/${championId}/${cardId}?mode=${mode}${talentId ? `&talentId=${talentId}` : ''}`
    );

    return {
      ...raw,
      cardId: Number(raw.cardId) || cardId,
      championId: Number(raw.championId) || championId,
      talentId: raw.talentId == null ? null : Number(raw.talentId),
      totalPlays: Number(raw.totalPlays) || 0,
      wins: Number(raw.wins) || 0,
      losses: Number(raw.losses) || 0,
      winRate: toDisplayPercent(raw.winRate) ?? 0,
      levels: (raw.levels ?? []).map((level) => ({
        level: Number(level.level) || 0,
        plays: Number(level.plays) || 0,
        winRate: toDisplayPercent(level.winRate) ?? 0,
      })),
      talents: (raw.talents ?? []).map((talent) => ({
        talentId: Number(talent.talentId) || 0,
        talentName: talent.talentName ?? 'Unknown',
        totalPlays: Number(talent.totalPlays) || 0,
        wins: Number(talent.wins) || 0,
        losses: Number(talent.losses) || 0,
        winRate: toDisplayPercent(talent.winRate) ?? 0,
      })),
    };
  } catch {
    return null;
  }
}
export async function fetchChampionCardStats(
  championId: number,
  mode: 'ranked' = 'ranked',
  talentId?: number | null,
  tier?: { tierMin?: number; tierMax?: number }
): Promise<ChampionCardStatsResponse> {
  try {
    const query = new URLSearchParams({ mode });
    if (talentId) query.set('talentId', String(talentId));
    if (tier?.tierMin != null) query.set('tierMin', String(tier.tierMin));
    if (tier?.tierMax != null) query.set('tierMax', String(tier.tierMax));
    const raw = await fetchJson<{
      totalMatches: number | string;
      cards: Array<{
        cardId: number | string;
        cardName: string;
        totalPlays: number | string;
        wins: number | string;
        losses: number | string;
        winRate: number | string;
        levels: Array<{
          level: number | string;
          plays: number | string;
          winRate: number | string;
        }>;
      }>;
    }>(`/stats/cards/${championId}?${query.toString()}`);

    return normalizeChampionCardStatsResponse(raw);
  } catch {
    return { totalMatches: 0, cards: [] };
  }
}

export async function fetchHourlyMatchCounts(params?: { date?: string; hour?: number; queueId?: number }): Promise<HourlyMatchCount[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.hour != null) query.set('hour', String(params.hour));
  if (params?.queueId != null) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Array<{
      date: string;
      hour: number | string;
      queue_id: number | string;
      matches_na?: number | string;
      matches_eu?: number | string;
      matches_asia?: number | string;
      matches_br?: number | string;
      matches_oce?: number | string;
      matches_sa?: number | string;
      matches_unknown?: number | string;
      total_matches?: number | string;
      fetched_at?: string | null;
    }>>(`/stats/hourly-match-counts${query.toString() ? `?${query.toString()}` : ''}`);
    const n = (value: number | string | undefined) => Number(value ?? 0);
    return raw.map((r) => ({
      date: r.date,
      hour: Number(r.hour),
      queueId: Number(r.queue_id),
      matches: {
        NA: n(r.matches_na),
        EU: n(r.matches_eu),
        Asia: n(r.matches_asia),
        BR: n(r.matches_br),
        OCE: n(r.matches_oce),
        SA: n(r.matches_sa),
        Unknown: n(r.matches_unknown),
      },
      totalMatches: n(r.total_matches),
      fetchedAt: r.fetched_at ?? null,
    }));
  } catch {
    return [];
  }
}

export async function fetchTiers(params?: { source?: 'profiles' | 'matches' }): Promise<TierStat[]> {
  const query = new URLSearchParams();
  if (params?.source) query.set('source', params.source);
  const raw = await fetchJson<Array<{
    tier: string;
    tier_sort: number | string;
    total_plays: number | string;
    avg_win_rate: number | string | null;
    percentage?: number | string | null;
  }>>(`/stats/tiers${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r) => ({
    tier: r.tier,
    tierSort: numberOrNull(r.tier_sort) ?? 0,
    totalPlays: numberOrNull(r.total_plays) ?? 0,
    avgWinRate: toDisplayPercent(r.avg_win_rate) ?? 0,
    percentage: numberOrNull(r.percentage) ?? 0,
  }));
}

export interface StatsOverview {
  metrics: PerformanceMetricsResponse;
  champions: Champion[];
  items: ItemStat[];
  maps: MapStat[];
  profileTiers: TierStat[];
  activeTiers: TierStat[];
}

let statsOverviewCache: { key: string; value: StatsOverview; expiresAt: number } | null = null;
let statsOverviewInFlight: { key: string; promise: Promise<StatsOverview> } | null = null;

function mapStatsOverview(raw: any): StatsOverview {
  const number = (value: unknown) => Number(value ?? 0);
  const mapItems = (rows: any[]): ItemStat[] => rows.map((row) => ({
    itemId: number(row.item_id), itemName: String(row.item_name ?? ''),
    totalUsage: number(row.total_uses ?? row.total_usage), winRate: number(row.win_rate),
    pickRate: row.pick_rate == null ? undefined : number(row.pick_rate),
    slots: (row.slots ?? []).map((slot: any) => ({ slot: number(slot.slot), totalUses: number(slot.total_uses), wins: 0, losses: 0, winRate: number(slot.win_rate) })),
    levels: (row.levels ?? []).map((level: any) => ({ level: number(level.item_level), totalUses: number(level.total_uses), wins: 0, losses: 0, winRate: number(level.win_rate) })),
    breakdown: (row.breakdown ?? []).map((entry: any) => ({ slot: number(entry.slot), level: number(entry.item_level), totalUses: number(entry.total_uses), wins: 0, losses: 0, winRate: number(entry.win_rate), pickRate: entry.pick_rate == null ? undefined : number(entry.pick_rate) })),
  }));
  const mapMaps = (rows: any[]): MapStat[] => rows.map((row) => ({
    name: String(row.map ?? ''), totalMatches: number(row.total_matches),
    distributionRate: number(row.distribution_rate), avgDurationSeconds: number(row.avg_duration_seconds),
  }));
  const mapTiers = (rows: any[]): TierStat[] => rows.map((row) => ({
    tier: String(row.tier ?? ''), tierSort: number(row.tier_sort), totalPlays: number(row.total_plays),
    avgWinRate: toDisplayPercent(row.avg_win_rate) ?? 0, percentage: number(row.percentage),
  }));
  return {
    metrics: Object.fromEntries(Object.entries(raw.metrics ?? {}).map(([metric, summary]) => [metric, mapMetricSummary(summary)])),
    champions: mapChampionsOverview(raw.champions ?? {}),
    items: mapItems(raw.items ?? []),
    maps: mapMaps(raw.maps ?? []),
    profileTiers: mapTiers(raw.profile_tiers ?? []),
    activeTiers: mapTiers(raw.active_tiers ?? []),
  };
}

function mapBaselineRows(rows: any[]): BaselineEntry[] {
  return rows.map((row) => ({
    role: String(row.role ?? ''), queueId: Number(row.queue_id ?? 486),
    avgCpm: Number(row.avg_gpm ?? 0), avgDpm: Number(row.avg_dpm ?? 0), avgHpm: Number(row.avg_hpm ?? 0),
    avgShpm: Number(row.avg_shpm ?? 0), avgSpm: Number(row.avg_mpm ?? 0), avgKda: Number(row.avg_kda ?? 0),
    p10Cpm: Number(row.p10_gpm ?? 0), p90Cpm: Number(row.p90_gpm ?? 0), p10Dpm: Number(row.p10_dpm ?? 0), p90Dpm: Number(row.p90_dpm ?? 0),
    avgEcpm: Number(row.avg_egpm ?? 0), p10Ecpm: Number(row.p10_egpm ?? 0), p25Ecpm: Number(row.p25_egpm ?? 0),
    p75Ecpm: Number(row.p75_egpm ?? 0), p90Ecpm: Number(row.p90_egpm ?? 0), maxEcpm: Number(row.max_egpm ?? 0),
    sampleSize: Number(row.sample_size ?? 0), updatedAt: row.updated_at ?? null,
  }));
}

export interface StatsPageData {
  overview: StatsOverview;
  baselines: BaselineEntry[];
  skins: SkinStat[];
  compositions: MatchCompositionStat[];
  brokenSkins: BrokenSkinStat[];
}

export async function fetchStatsPageData(params?: { tierMin?: number; tierMax?: number }): Promise<StatsPageData> {
  const query = new URLSearchParams();
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  const raw = await fetchJson<any>(`/stats/page-data${query.toString() ? `?${query.toString()}` : ''}`, { unwrapData: false });
  const skinRows = (rows: any[]): SkinStat[] => rows.map((row) => ({
    skinId: Number(row.skin_id), skinName: String(row.skin_name ?? 'Unknown Skin'), championId: Number(row.champion_id), championName: String(row.champion_name ?? 'Unknown Champion'),
    totalPlays: Number(row.total_plays ?? 0), wins: Number(row.wins ?? 0), losses: Number(row.losses ?? 0), winRate: Number(row.win_rate ?? 0),
  }));
  const compositions = (rows: any[]): MatchCompositionStat[] => rows.map((row) => ({
    composition: String(row.comp_id), frontline: Number(row.frontline ?? 0), damage: Number(row.damage ?? 0), flank: Number(row.flank ?? 0), support: Number(row.support ?? 0),
    totalMatches: Number(row.count ?? 0), wins: Number(row.wins ?? 0), losses: Number(row.losses ?? 0), winRate: Number(row.winrate ?? 0),
  }));
  return {
    overview: mapStatsOverview(raw.overview ?? {}),
    baselines: mapBaselineRows(raw.baselines ?? []),
    skins: skinRows(raw.skins ?? []),
    compositions: compositions(raw.compositions ?? []),
    brokenSkins: (raw.broken_skins ?? []).map((row: any) => ({ ...skinRows([row])[0], usageShare: Number(row.usage_share ?? 0) })),
  };
}

export async function fetchStatsOverview(): Promise<StatsOverview> {
  const cacheKey = getStoredLobbyTierFilter();
  if (statsOverviewCache?.key === cacheKey && statsOverviewCache.expiresAt > Date.now()) return statsOverviewCache.value;
  if (statsOverviewInFlight?.key === cacheKey) return statsOverviewInFlight.promise;
  const promise = (async () => {
    const raw = await fetchJson<any>('/stats/overview', { unwrapData: false });
    const number = (value: unknown) => Number(value ?? 0);
    const mapItems = (rows: any[]): ItemStat[] => rows.map((row) => ({
      itemId: number(row.item_id), itemName: String(row.item_name ?? ''),
      totalUsage: number(row.total_uses ?? row.total_usage), winRate: number(row.win_rate),
      pickRate: row.pick_rate == null ? undefined : number(row.pick_rate),
      slots: (row.slots ?? []).map((slot: any) => ({ slot: number(slot.slot), totalUses: number(slot.total_uses), wins: 0, losses: 0, winRate: number(slot.win_rate) })),
      levels: (row.levels ?? []).map((level: any) => ({ level: number(level.item_level), totalUses: number(level.total_uses), wins: 0, losses: 0, winRate: number(level.win_rate) })),
      breakdown: (row.breakdown ?? []).map((entry: any) => ({ slot: number(entry.slot), level: number(entry.item_level), totalUses: number(entry.total_uses), wins: 0, losses: 0, winRate: number(entry.win_rate), pickRate: entry.pick_rate == null ? undefined : number(entry.pick_rate) })),
    }));
    const mapMaps = (rows: any[]): MapStat[] => rows.map((row) => ({
      name: String(row.map ?? ''), totalMatches: number(row.total_matches),
      distributionRate: number(row.distribution_rate), avgDurationSeconds: number(row.avg_duration_seconds),
    }));
    const mapTiers = (rows: any[]): TierStat[] => rows.map((row) => ({
      tier: String(row.tier ?? ''), tierSort: number(row.tier_sort), totalPlays: number(row.total_plays),
      avgWinRate: toDisplayPercent(row.avg_win_rate) ?? 0, percentage: number(row.percentage),
    }));
    const overview: StatsOverview = {
      metrics: Object.fromEntries(Object.entries(raw.metrics ?? {}).map(([metric, summary]) => [metric, mapMetricSummary(summary)])),
      champions: mapChampionsOverview(raw.champions ?? {}),
      items: mapItems(raw.items ?? []),
      maps: mapMaps(raw.maps ?? []),
      profileTiers: mapTiers(raw.profile_tiers ?? []),
      activeTiers: mapTiers(raw.active_tiers ?? []),
    };
    statsOverviewCache = { key: cacheKey, value: overview, expiresAt: Date.now() + 300_000 };
    return overview;
  })();
  statsOverviewInFlight = { key: cacheKey, promise };
  try {
    return await promise;
  } finally {
    if (statsOverviewInFlight?.promise === promise) statsOverviewInFlight = null;
  }
}

export async function fetchTierSummary(): Promise<TierSummary> {
  const raw = await fetchJson<{
    profile_players: number | string | null;
    avg_profile_tier: number | string | null;
    match_player_rows: number | string | null;
    active_players: number | string | null;
    ranked_matches: number | string | null;
    avg_participation_tier: number | string | null;
    avg_match_tier: number | string | null;
    median_match_tier: number | string | null;
  }>('/stats/tiers/summary');

  return {
    profilePlayers: numberOrNull(raw.profile_players) ?? 0,
    avgProfileTier: numberOrNull(raw.avg_profile_tier) ?? 0,
    matchPlayerRows: numberOrNull(raw.match_player_rows) ?? 0,
    activePlayers: numberOrNull(raw.active_players) ?? 0,
    rankedMatches: numberOrNull(raw.ranked_matches) ?? 0,
    avgParticipationTier: numberOrNull(raw.avg_participation_tier) ?? 0,
    avgMatchTier: numberOrNull(raw.avg_match_tier) ?? 0,
    medianMatchTier: numberOrNull(raw.median_match_tier) ?? 0,
  };
}

export async function fetchTalents(): Promise<Array<{
  talentId: number;
  talentName: string;
  championId: number;
  championName: string;
  totalPlays: number;
  winRate: number;
}>> {
  const raw = await fetchJson<Array<{
    talent_id: number | string;
    name?: string;
    talent_name?: string;
    champion_id?: number | string | null;
    champion_name?: string | null;
    total_plays?: number | string;
    total_uses?: number | string;
    win_rate: number | string;
  }>>(`/stats/talents`);

  return raw.map((r) => ({
    talentId: numberOrNull(r.talent_id) ?? 0,
    talentName: r.talent_name ?? r.name ?? `Talent ${r.talent_id}`,
    championId: numberOrNull(r.champion_id) ?? 0,
    championName: r.champion_name ?? 'Unknown',
    totalPlays: numberOrNull(r.total_plays ?? r.total_uses) ?? 0,
    winRate: toDisplayPercent(r.win_rate) ?? 0,
  }));
}

// ── Auth Types ──

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: string;
  lastLogin: string | null;
  timeZone: string | null;
  linkedPlayerId: number | null;
  linkedPlayerName: string | null;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

// ── Auth Helpers ──

const TOKEN_KEY = "pc_auth_token";
const USER_KEY = "pc_auth_user";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  // CRITICAL: Wrap JSON.parse in try-catch. If localStorage data is corrupted
  // (partial write, browser crash, manual tampering), JSON.parse throws and
  // crashes the calling component. This happens on every page render (nav.tsx).
  // Source: Fault #2 — "JSON.parse unguarded on corrupted localStorage"
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setAuthSession(session: AuthSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

// ── Auth ──

export async function register(username: string, email: string, password: string): Promise<AuthSession> {
  const raw = await fetchJson<{
    message: string;
    user: { id: number; username: string; email?: string | null; avatar_url?: string | null; bio?: string | null; is_admin?: boolean; is_approved?: boolean; created_at?: string; last_login?: string | null; time_zone?: string | null };
    token: string;
    expires_at?: string;
  }>(`/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  // The backend creates the session in the same transaction window as the user
  // insert. Do not re-login here: that turns a successful registration into a
  // user-visible failure if a later login read hits schema drift or a transient
  // DB issue. Store the returned session exactly like login() does.
  const session: AuthSession = {
    user: {
      id: raw.user.id,
      username: raw.user.username,
      email: raw.user.email ?? email,
      avatarUrl: raw.user.avatar_url ?? null,
      bio: raw.user.bio ?? null,
      isAdmin: raw.user.is_admin ?? false,
      isApproved: raw.user.is_approved ?? false,
      createdAt: raw.user.created_at ?? new Date().toISOString(),
      lastLogin: raw.user.last_login ?? null,
      timeZone: raw.user.time_zone ?? null,
      linkedPlayerId: null,
      linkedPlayerName: null,
    },
    token: raw.token,
    expiresAt: raw.expires_at ?? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  };

  setAuthSession(session);
  return session;
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const raw = await fetchJson<{
    user: { id: number; username: string; email?: string | null; avatar_url?: string | null; bio?: string | null; is_admin?: boolean; is_approved?: boolean; created_at?: string; last_login?: string | null; time_zone?: string | null; linked_player_id?: number | null; linked_player_name?: string | null };
    token: string;
    expires_at?: string;
  }>(`/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const session: AuthSession = {
    user: {
      id: raw.user.id,
      username: raw.user.username,
      email: raw.user.email ?? "",
      avatarUrl: raw.user.avatar_url ?? null,
      bio: raw.user.bio ?? null,
      isAdmin: raw.user.is_admin ?? false,
      isApproved: raw.user.is_approved ?? false,
      createdAt: raw.user.created_at ?? new Date().toISOString(),
      lastLogin: raw.user.last_login ?? null,
      timeZone: raw.user.time_zone ?? null,
      linkedPlayerId: raw.user.linked_player_id ?? null,
      linkedPlayerName: raw.user.linked_player_name ?? null,
    },
    token: raw.token,
    expiresAt: raw.expires_at ?? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  };

  setAuthSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const token = getAuthToken();
  try {
    if (token) {
      // Logout must be local-first from the user's perspective. The server call
      // invalidates the remote session when reachable, but a stale token,
      // offline backend, or dev proxy failure must not trap the browser in a
      // zombie logged-in state. Local storage is cleared in finally below.
      await fetchJson<unknown>(`/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        retries: 0,
      });
    }
  } catch (err) {
    console.warn("Server logout failed; clearing local session anyway.", err);
  } finally {
    clearAuth();
  }
}

export async function getMe(_userId?: number): Promise<AuthUser> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.notAuthenticated);
  }
  const raw = await fetchJson<{
    user_id?: number;
    id?: number;
    username: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    is_admin?: boolean;
    is_approved?: boolean;
    created_at?: string;
    last_login?: string | null;
    time_zone?: string | null;
    linked_player_id?: number | null;
    linked_player_name?: string | null;
  }>(`/auth/me`, {
    headers: { "Authorization": `Bearer ${token}` },
  });

  return {
    id: raw.id ?? raw.user_id ?? 0,
    username: raw.username,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    bio: raw.bio,
    isAdmin: raw.is_admin ?? false,
    isApproved: raw.is_approved ?? false,
    createdAt: raw.created_at ?? "",
    lastLogin: raw.last_login ?? null,
    timeZone: raw.time_zone ?? null,
    linkedPlayerId: raw.linked_player_id ?? null,
    linkedPlayerName: raw.linked_player_name ?? null,
  };
}

export async function getUserProfile(userId: number): Promise<AuthUser> {
  const raw = await fetchJson<{
    id: number;
    username: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    is_admin?: boolean;
    is_approved?: boolean;
    created_at: string;
    last_login: string | null;
  }>(`/players/${userId}`);

  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    bio: raw.bio,
    isAdmin: raw.is_admin ?? false,
    isApproved: raw.is_approved ?? false,
    createdAt: raw.created_at,
    lastLogin: raw.last_login,
    timeZone: null,
    linkedPlayerId: null,
    linkedPlayerName: null,
  };
}

// ── Account Management ──

export interface AccountDetails {
  user: AuthUser & { linked_player_id: number | null };
  linkedPlayer: {
    id: number;
    name: string;
    platform_name: string | null;
    level: number | null;
    wins: number | null;
    losses: number | null;
    kbm_tier: string | null;
    kbm_points: number | null;
  } | null;
}

export interface AccountNotification {
  id: number;
  type: "community_comment";
  postId: number | null;
  commentId: number | null;
  actorUsername: string;
  postTitle: string | null;
  commentContent: string | null;
  readAt: string | null;
  createdAt: string;
}

export async function getAccountNotifications(limit = 25): Promise<AccountNotification[]> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const rows = await fetchJson<Array<{
    id: number; type: "community_comment"; post_id: number | null; comment_id: number | null;
    actor_username: string; post_title: string | null; comment_content: string | null;
    read_at: string | null; created_at: string;
  }>>(`/auth/account/notifications?limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } });
  return rows.map((notification) => ({
    id: notification.id,
    type: notification.type,
    postId: notification.post_id,
    commentId: notification.comment_id,
    actorUsername: notification.actor_username,
    postTitle: notification.post_title,
    commentContent: notification.comment_content,
    readAt: notification.read_at,
    createdAt: notification.created_at,
  }));
}

export async function markAccountNotificationRead(notificationId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  await fetchJson(`/auth/account/notifications/${notificationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAccountDetails(): Promise<AccountDetails> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.notAuthenticated);
  }
  const raw = await fetchJson<{
    user: { id: number; username: string; email: string; avatar_url: string | null; bio: string | null; is_admin?: boolean; is_approved?: boolean; linked_player_id: number | null; created_at: string; last_login: string | null; time_zone?: string | null };
    linkedPlayer: AccountDetails["linkedPlayer"];
  }>("/auth/account", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    user: {
      id: raw.user.id,
      username: raw.user.username,
      email: raw.user.email,
      avatarUrl: raw.user.avatar_url,
      bio: raw.user.bio,
      isAdmin: raw.user.is_admin ?? false,
      isApproved: raw.user.is_approved ?? false,
      createdAt: raw.user.created_at,
      lastLogin: raw.user.last_login,
      timeZone: raw.user.time_zone ?? null,
      linkedPlayerId: raw.user.linked_player_id ?? null,
      linkedPlayerName: raw.linkedPlayer?.name ?? null,
      linked_player_id: raw.user.linked_player_id,
    },
    linkedPlayer: raw.linkedPlayer,
  };
}

export async function linkPlayerId(playerId: number): Promise<{ message: string; player: { id: number; name: string } }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.notAuthenticated);
  }
  return fetchJson<{ message: string; player: { id: number; name: string } }>("/auth/account/player-link", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "link", playerId }),
  });
}

export interface PlayerLinkVerification {
  player: { id: number; name: string };
  code: string;
  expiresAt: string;
}

export async function getPlayerLinkVerification(): Promise<PlayerLinkVerification | null> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const raw = await fetchJson<{ verification: PlayerLinkVerification | null }>("/auth/account/player-link/verification", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return raw.verification;
}

export async function startPlayerLinkVerification(playerId: number): Promise<PlayerLinkVerification> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  const raw = await fetchJson<{ verification: PlayerLinkVerification }>("/auth/account/player-link/verification", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ playerId }),
  });
  return raw.verification;
}

export async function verifyPlayerLink(): Promise<{ message: string; player: { id: number; name: string } }> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  return fetchJson<{ message: string; player: { id: number; name: string } }>("/auth/account/player-link/verification/check", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
}

export async function cancelPlayerLinkVerification(): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error(API_ERROR_KEYS.notAuthenticated);
  await fetchJson<{ message: string }>("/auth/account/player-link/verification", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function unlinkPlayer(): Promise<{ message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.notAuthenticated);
  }
  return fetchJson<{ message: string }>("/auth/account/player-link", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "unlink" }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.notAuthenticated);
  }
  return fetchJson<{ message: string }>("/auth/account/password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function updateProfile(data: { avatar_url?: string | null; bio?: string | null; time_zone?: string }): Promise<{ message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.notAuthenticated);
  }
  return fetchJson<{ message: string }>("/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// ── Player Report ──

export type ReportType = 'suspicious' | 'cheater' | 'approve' | 'weirdo' | 'hall_of_fame' | 'dropper' | 'afk_wintrade';

export interface ReportOptions {
  type: ReportType;
  reason?: string;
}

export async function reportPlayer(playerId: string | number, opts: ReportOptions): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.authenticationRequired);
  }
  const body: Record<string, string> = { type: opts.type };
  if (opts.reason?.trim()) body.reason = opts.reason.trim();
  const raw = await fetchJson<{ success: boolean; message: string }>(`/players/${playerId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return raw;
}

export async function reportPrivateAccount(privateId: string | number, opts: ReportOptions): Promise<{ success: boolean; message: string }> {
  if (opts.type !== 'suspicious' && opts.type !== 'cheater') {
    throw new Error(API_ERROR_KEYS.genericFailure);
  }
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.authenticationRequired);
  }
  const body: Record<string, string> = { type: opts.type };
  if (opts.reason?.trim()) body.reason = opts.reason.trim();
  return fetchJson<{ success: boolean; message: string }>(`/player-ext/private/${privateId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export type ClearablePlayerTag = 'cheater' | 'suspicious' | 'dropper' | 'afk_wintrade' | 'alt_account';

export async function clearPlayerTag(playerId: string | number, tag: ClearablePlayerTag): Promise<{ success: boolean; message: string; cleared: boolean }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error(API_ERROR_KEYS.authenticationRequired);
  }
  return fetchJson<{ success: boolean; message: string; cleared: boolean }>(`/players/${playerId}/clear-tag`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ tag }),
  });
}

// ── Community Types ──

export interface Post {
  id: number;
  userId: number;
  username: string;
  linkedPlayerId: number | null;
  title: string;
  content: string;
  buildId: number | null;
  tierListId: number | null;
  likes: number;
  viewCount: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  username: string;
  linkedPlayerId: number | null;
  parentId: number | null;
  content: string;
  createdAt: string;
}

export interface PostDetail {
  post: Post;
  comments: Comment[];
}

export interface TwitchStream {
  userLogin: string;
  userName: string;
  title: string;
  viewerCount: number;
  language: string;
  thumbnailUrl: string;
  tags: string[];
  url: string;
}

export interface TwitchStreamsResponse {
  configured: boolean;
  streams: TwitchStream[];
}

type RawPost = {
  id: number;
  user_id: number;
  username: string;
  linked_player_id?: number | null;
  title: string;
  content: string;
  build_id: number | null;
  tier_list_id?: number | null;
  likes: number;
  view_count: number;
  created_at: string;
};

type RawComment = {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  linked_player_id?: number | null;
  parent_id: number | null;
  content: string;
  created_at: string;
};

function mapPost(raw: RawPost): Post {
  return {
    id: raw.id,
    userId: raw.user_id,
    username: raw.username,
    linkedPlayerId: raw.linked_player_id ?? null,
    title: raw.title,
    content: raw.content,
    buildId: raw.build_id,
    tierListId: raw.tier_list_id ?? null,
    likes: raw.likes,
    viewCount: raw.view_count,
    createdAt: raw.created_at,
  };
}

function mapComment(raw: RawComment): Comment {
  return {
    id: raw.id,
    postId: raw.post_id,
    userId: raw.user_id,
    username: raw.username,
    linkedPlayerId: raw.linked_player_id ?? null,
    parentId: raw.parent_id,
    content: raw.content,
    createdAt: raw.created_at,
  };
}

// ── Community ──

export async function fetchPosts(params?: { userId?: string; buildId?: string; limit?: string; offset?: string }): Promise<Post[]> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<RawPost[]>(`/community/posts${query.toString() ? `?${query.toString()}` : ''}`);
  return raw.map(mapPost);
}

export async function fetchTwitchStreams(): Promise<TwitchStreamsResponse> {
  const raw = await fetchJson<{
    configured?: boolean;
    streams?: Array<{
      userLogin: string;
      userName: string;
      title: string;
      viewerCount: number | string;
      language: string;
      thumbnailUrl: string;
      tags?: string[];
      url: string;
    }>;
  }>('/community/streams');
  return {
    configured: raw.configured === true,
    streams: (raw.streams ?? []).map((stream) => ({
      ...stream,
      viewerCount: Number(stream.viewerCount) || 0,
      tags: stream.tags ?? [],
    })),
  };
}

export async function createPost(userId: number, title: string, content: string, buildId: number | null, token: string): Promise<Post> {
  const raw = await fetchJson<RawPost>(`/community/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ title, content, build_id: buildId }),
  });

  return mapPost(raw);
}

export async function getPostDetail(postId: number): Promise<PostDetail> {
  const raw = await fetchJson<{
    post: RawPost;
    comments: RawComment[];
  }>(`/community/posts/${postId}`);

  return {
    post: mapPost(raw.post),
    comments: raw.comments.map(mapComment),
  };
}

export async function updatePost(postId: number, title: string, content: string, token: string): Promise<Post> {
  const raw = await fetchJson<RawPost>(`/community/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ title, content }),
  });

  return mapPost(raw);
}

export async function deletePost(postId: number, token: string): Promise<void> {
  await fetchJson<{ deleted: boolean; id: number }>(`/community/posts/${postId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
}

export async function addComment(postId: number, userId: number, content: string, parentId: number | null, token: string): Promise<Comment> {
  const raw = await fetchJson<RawComment>(`/community/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ content, parent_id: parentId }),
  });

  return mapComment(raw);
}

export async function updateComment(commentId: number, content: string, token: string): Promise<Comment> {
  const raw = await fetchJson<RawComment>(`/community/comments/${commentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });

  return mapComment(raw);
}

export async function deleteComment(commentId: number, token: string): Promise<void> {
  await fetchJson<{ deleted: boolean; id: number }>(`/community/comments/${commentId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
}

export async function togglePostLike(postId: number, userId: number, token: string): Promise<number> {
  const raw = await fetchJson<{ likes: number }>(`/community/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({}),
  });

  return raw.likes;
}
// ── Build Types ──

export interface BuildCardSelection {
  cardId: number;
  level: number;
}

export interface Build {
  id: number;
  userId: number;
  username: string;
  championId: number;
  championName: string;
  name: string;
  items: number[];
  cards: BuildCardSelection[];
  actives: number[];
  talents: number[];
  notes: string | null;
  visibility: string;
  likes: number;
  viewCount: number;
  createdAt: string;
}

type RawBuild = {
  id: number;
  user_id: number;
  username?: string;
  champion_id: number;
  champion_name?: string;
  name: string;
  items?: number[] | null;
  cards?: unknown;
  actives?: number[] | null;
  talents?: number[] | null;
  notes: string | null;
  visibility: string;
  likes: number;
  view_count: number;
  created_at: string;
};

function mapBuildCards(cards: unknown): BuildCardSelection[] {
  if (!Array.isArray(cards)) return [];
  return cards
    .map((card) => {
      if (typeof card === "number") return { cardId: card, level: 1 };
      if (!card || typeof card !== "object") return null;
      const row = card as { cardId?: unknown; card_id?: unknown; level?: unknown; card_level?: unknown };
      const cardId = Number(row.cardId ?? row.card_id);
      const level = Number(row.level ?? row.card_level ?? 1);
      if (!Number.isFinite(cardId) || cardId === 0) return null;
      return {
        cardId,
        level: Number.isFinite(level) ? Math.min(5, Math.max(1, Math.round(level))) : 1,
      };
    })
    .filter((card): card is BuildCardSelection => card !== null);
}

function mapBuild(raw: RawBuild): Build {
  return {
    id: raw.id,
    userId: raw.user_id,
    username: raw.username ?? "Unknown",
    championId: raw.champion_id,
    championName: raw.champion_name ?? `Champion ${raw.champion_id}`,
    name: raw.name,
    items: raw.items ?? [],
    cards: mapBuildCards(raw.cards),
    actives: raw.actives ?? [],
    talents: raw.talents ?? [],
    notes: raw.notes,
    visibility: raw.visibility,
    likes: raw.likes,
    viewCount: raw.view_count,
    createdAt: raw.created_at,
  };
}

// ── Builds ──

export async function fetchBuilds(params?: { championId?: string; visibility?: string; limit?: string; offset?: string }): Promise<Build[]> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<RawBuild[]>(`/builds${query.toString() ? `?${query.toString()}` : ''}`);
  return raw.map(mapBuild);
}

export async function createBuild(
  userId: number,
  championId: number,
  name: string,
  items: number[],
  cards: BuildCardSelection[],
  talents: number[],
  notes: string | null,
  visibility: string,
  token: string,
): Promise<Build> {
  void userId;
  const raw = await fetchJson<RawBuild>(`/builds`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      champion_id: championId,
      name,
      items,
      cards: cards.map((card) => ({ card_id: card.cardId, level: card.level })),
      actives: [],
      talents,
      notes,
      visibility,
    }),
  });

  return mapBuild(raw);
}

export async function getBuildDetail(buildId: number): Promise<Build> {
  const raw = await fetchJson<RawBuild>(`/builds/${buildId}`);
  return mapBuild(raw);
}

export async function toggleBuildLike(buildId: number, userId: number, token: string): Promise<number> {
  void userId;
  const raw = await fetchJson<{ likes: number }>(`/builds/${buildId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  });

  return raw.likes;
}
// ── Chart Types ──

export interface KdaHistoryEntry {
  date: string;
  kills: number;
  deaths: number;
  assists: number;
}

export interface DpmHistoryEntry {
  date: string;
  playerDpm: number;
  avgDpm: number;
}

export interface GlickoHistoryEntry {
  date: string;
  rating: number;
}

// ── Charts ──

type PlayerChartRow = {
  entry_datetime: string;
  kills?: number | string | null;
  deaths?: number | string | null;
  assists?: number | string | null;
  damage_per_minute?: number | string | null;
  rating?: number | string | null;
};

function playerChartPath(playerId: string, days: number, limit: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const query = new URLSearchParams({
    limit: String(limit),
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return `/players/${encodeURIComponent(playerId)}/charts?${query.toString()}`;
}

export async function fetchKdaHistory(playerId: string, days: number = 30, limit: number = 50): Promise<KdaHistoryEntry[]> {
  const raw = await fetchJson<PlayerChartRow[]>(playerChartPath(playerId, days, limit));

  return raw.map((r) => ({
    date: r.entry_datetime,
    kills: Number(r.kills ?? 0),
    deaths: Number(r.deaths ?? 0),
    assists: Number(r.assists ?? 0),
  }));
}

export async function fetchDpmHistory(playerId: string, days: number = 30, limit: number = 50): Promise<DpmHistoryEntry[]> {
  const raw = await fetchJson<PlayerChartRow[]>(playerChartPath(playerId, days, limit));
  const values = raw.map((r) => Number(r.damage_per_minute ?? 0)).filter((value) => Number.isFinite(value));
  const avgDpm = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  return raw.map((r) => ({
    date: r.entry_datetime,
    playerDpm: Number(r.damage_per_minute ?? 0),
    avgDpm,
  }));
}

export async function fetchGlickoHistory(playerId: string, days: number = 30, limit: number = 50): Promise<GlickoHistoryEntry[]> {
  const raw = await fetchJson<PlayerChartRow[]>(playerChartPath(playerId, days, limit));

  return raw
    .filter((r) => r.rating != null)
    .map((r) => ({
      date: r.entry_datetime,
      rating: Number(r.rating),
    }));
}

// ── Match Types ──

/**
 * MatchPlayerDetail — local type for match player data from the API.
 * Renamed from MatchPlayer to avoid collision with the imported MatchPlayer
 * from types.gen.ts, which has a different shape (id, name vs player_id, player_name).
 */
export interface MatchPlayerDetail {
  player_id: number;
  player_name: string;
  private_slot?: number | null;
  private_player_id?: number | null;
  private_account_alias?: string | null;
  private_account_verified_name?: string | null;
  private_account_display_name?: string | null;
  champion_id: number;
  champion_name: string;
  skin_id: number;
  skin_name: string;
  kills: number;
  deaths: number;
  assists: number;
  damage_done_physical: number;
  damage_done_magical: number;
  damage_done_in_hand?: number;
  damage_taken?: number;
  damage_mitigated?: number;
  mitigation_per_minute?: number;
  healing?: number;
  healing_self?: number;
  healing_bot?: number;
  healing_player_self?: number;
  gold_earned: number;
  gold_per_minute?: number;
  egpm?: number | null;
  objective_assists?: number;
  camps_cleared?: number;
  structure_damage?: number;
  wards_placed?: number;
  towers_destroyed?: number;
  distance_traveled?: number;
  multi_kill_max?: number;
  killing_spree?: number;
  kills_first_blood?: number;
  kills_double?: number;
  kills_triple?: number;
  kills_quadra?: number;
  kills_penta?: number;
  win_status: string;
  task_force: number;
  league_tier: string | null;
  league_points?: number | null;
  league_wins?: number | null;
  league_losses?: number | null;
  account_level?: number | null;
  mastery_level?: number | null;
  platform?: string | null;
  region?: string | null;
  tier?: number | null;
  source?: string | null;
  party_id?: number | null;
  party?: number | null;
  /** Legacy alias retained for older API payloads. */
  party_number?: number | null;
  final_match_level?: number | null;
  kda: number;
  damage_per_minute: number;
  healing_per_minute: number;
  healing_self_per_minute: number;
  time_in_match: number;
  afk_rate: number;
  profile_snapshot?: MatchPlayerProfileSnapshot | null;
}

export interface MatchPlayerProfileSnapshot {
  captured_at: string | null;
  source: 'post_match_ingest' | 'match_player' | string;
  level: number | null;
  platform: string | null;
  region: string | null;
  global_wins: number | null;
  global_losses: number | null;
  kbm_tier: number | null;
  kbm_points: number | null;
  kbm_rank: number | null;
  kbm_wins: number | null;
  kbm_losses: number | null;
  champion_wins: number | null;
  champion_losses: number | null;
  queue_elo: number | null;
  champion_elo: number | null;
  cheater: boolean;
  sus_count: number;
  verified: boolean;
}

export interface MatchBan {
  ban_slot?: number;
  champion_id: number;
  champion_name?: string;
}

export interface MatchData {
  match_id: number;
  entry_datetime: string;
  map: string;
  queue_id: number;
  duration_seconds: number;
  region: string;
  team1_score: number | null;
  team2_score: number | null;
  winning_task_force: number;
  is_ranked: boolean;
  recovered: boolean;
  broken: boolean;
  private: boolean;
  limited: boolean;
  limited_reason?: string | null;
}

/**
 * MatchDetail with bans — local type that includes the bans array.
 * The imported MatchDetail from types.gen.ts lacks 'bans', so we use
 * this local type for match detail pages that need ban data.
 */
export interface MatchDetailWithBans {
  match: MatchData;
  players: MatchPlayerDetail[];
  bans: MatchBan[];
}

export function deriveMissingMatchCreditRates(detail: MatchDetailWithBans): MatchDetailWithBans {
  return {
    ...detail,
    players: detail.players.map((player) => {
      const credits = Number(player.gold_earned ?? 0);
      const seconds = Number(detail.match.duration_seconds ?? 0);
      const storedCpm = Number(player.gold_per_minute ?? 0);
      const storedEcpm = Number(player.egpm ?? 0);
      if ((storedCpm > 0 && storedEcpm > 0) || credits <= 0 || seconds <= 0) return player;
      return {
        ...player,
        gold_per_minute: storedCpm > 0
          ? player.gold_per_minute
          : Math.round((credits * 60 / seconds) * 100) / 100,
        egpm: storedEcpm > 0
          ? player.egpm
          : Math.round(((credits - 500) * 60 / seconds) * 100) / 100,
      };
    }),
  };
}

export interface MatchFactPlayer {
  player_id: number;
  player_name: string;
  champion_id?: number;
  champion_name?: string;
  items: Array<{
    item_id: number;
    slot: number;
    item_level?: number | null;
    item_name?: string | null;
    description?: string | null;
    item_type?: string | null;
    cost?: number | null;
    icon_url?: string | null;
    fallback_icon_url?: string | null;
  }>;
  cards: Array<{
    card_id: number;
    card_level?: number | null;
    card_name?: string | null;
    champion_id?: number | null;
    icon_url?: string | null;
    fallback_icon_url?: string | null;
  }>;
  talents: Array<{
    talent_id: number;
    talent_name?: string | null;
    champion_id?: number | null;
    champion_name?: string | null;
    icon_url?: string | null;
    fallback_icon_url?: string | null;
  }>;
}

export interface MatchFact {
  match_id: number;
  players: MatchFactPlayer[];
}

export interface RatingSnapshot {
  player_id: number;
  player_name: string;
  match_id: number;
  queue_id: number;
  mu_before: number | null;
  phi_before: number | null;
  mu_after: number | null;
  phi_after: number | null;
  mu_change: number | null;
}

export interface MatchSearchResult {
  match_id: number;
  entry_datetime: string;
  map: string;
  queue_id: number;
  duration_seconds: number;
  region: string;
  champion_id: number;
  champion_name: string;
  win_status: string;
  kills: number;
  deaths: number;
  assists: number;
  player_count: number;
}

// ── Matches ──

export interface MatchHourlyStats {
  totalToday: number;
  rankedToday: number;
  regions: Array<{ region: string; matchesPerHour: number; totalToday: number }>;
  hourly?: Array<{ hour: number; date?: string; NA: number; EU: number; Asia: number; BR: number; OCE: number; LATAM: number; total: number }>;
  currentHour?: number;
  allQueuesTotal24h?: number;
  queues?: MatchQueueActivity[];
  weekly?: Array<{
    date: string;
    total: number;
    ranked: number;
    queues: Record<string, number>;
    players: number;
    playerQueues: Record<string, number>;
  }>;
}

export interface MatchQueueActivity {
  queueId: number;
  queueName: string;
  ranked: boolean;
  total24h: number;
  regions: Array<{ region: string; total24h: number; matchesPerHour: number }>;
  hourly: Array<{ hour: number; date: string; total: number; regions: Record<string, number> }>;
}

export async function fetchMatchHourlyStats(): Promise<MatchHourlyStats> {
  return fetchJson<MatchHourlyStats>('/matches/hourly-stats');
}

export interface PresenceStats {
  window_hours: number;
  observed_at: string;
  public_players: number;
  unresolved_player_slots_lower: number;
  unresolved_player_slots_upper: number;
  unresolved_matches: number;
  public_players_lower_bound: number;
  public_players_upper_bound: number;
  private_players: number;
  unresolved_private_observations: number;
  public_by_scope: Array<{ stats_scope: PublicStatsScope; players: number }>;
  private_by_scope: Array<{ stats_scope: PublicStatsScope; players: number }>;
  unresolved_by_scope: Array<{ stats_scope: PublicStatsScope; observations: number }>;
  public_by_queue: Array<{
    queue_id: number;
    queue_name: string;
    stats_scope: PublicStatsScope;
    players: number;
  }>;
  public_by_platform: Array<{ platform: string; players: number }>;
  public_by_region: Array<{ region: string; players: number }>;
  profile_coverage: {
    total: number;
    fresh: number;
    platform_known: number;
    platform_unknown: number;
    last_enrichment_at: string | null;
  };
}

export async function fetchPresenceStats(): Promise<PresenceStats> {
  // Version the activity view so a deployment cannot briefly receive the
  // previous cached response shape from the shared stats route cache.
  return fetchJson<PresenceStats>('/stats/presence?view=activity-v4');
}

export interface PresenceMatchIdsResponse {
  window_hours: number;
  observed_at: string;
  total_matches: number;
  selected_queue_id: number | null;
  queues: Array<{
    queue_id: number;
    queue_name: string;
    matches: number;
  }>;
  match_ids: Array<{
    match_id: string;
    queue_id: number;
  }>;
  page: {
    current: number;
    size: number;
    total_pages: number;
  };
}

export async function fetchPresenceMatchIds(options: {
  queueId?: number;
  page?: number;
  perPage?: number;
} = {}): Promise<PresenceMatchIdsResponse> {
  const params = new URLSearchParams({
    view: 'facts-v2',
    page: String(options.page ?? 1),
    per_page: String(options.perPage ?? 250),
  });
  if (options.queueId != null) params.set('queue_id', String(options.queueId));
  return fetchJson<PresenceMatchIdsResponse>(`/stats/presence/match-ids?${params.toString()}`);
}

export type PresencePlayerSort = 'matches' | 'alphabetical';

export interface PresencePlayersResponse {
  window_hours: number;
  observed_at: string;
  total_players: number;
  unresolved_player_slots_lower: number;
  unresolved_player_slots_upper: number;
  unresolved_matches: number;
  public_players_lower_bound: number;
  public_players_upper_bound: number;
  total_matches?: number;
  represented_matches?: number;
  unrepresented_matches?: number;
  total_participations?: number;
  selected_queue_id: number | null;
  players: Array<{
    player_id: string;
    player_name: string;
    matches_played: number;
  }>;
  sort: PresencePlayerSort;
  page: {
    current: number;
    size: number;
    total_pages: number;
  };
}

export async function fetchPresencePlayers(options: {
  queueId?: number;
  page?: number;
  perPage?: number;
  sort?: PresencePlayerSort;
} = {}): Promise<PresencePlayersResponse> {
  const params = new URLSearchParams({
    view: 'facts-v3',
    page: String(options.page ?? 1),
    per_page: String(options.perPage ?? 250),
    sort: options.sort ?? 'matches',
  });
  if (options.queueId != null) params.set('queue_id', String(options.queueId));
  return fetchJson<PresencePlayersResponse>(`/stats/presence/players?${params.toString()}`);
}

export interface PresenceDetailPlayer {
  player_id: string;
  player_name: string;
  platform: string;
  participant_kind: string;
  source: string;
}

export interface PresenceDetailMatch {
  match_id: string;
  queue_id: number;
  queue_name: string;
  stats_scope: PublicStatsScope;
  entry_datetime: string;
  region: string;
  map: string;
  status: string;
  quality: string;
  terminal_reason: string | null;
  players: PresenceDetailPlayer[];
}

export interface PresenceDetailsResponse {
  window_hours: number;
  observed_at: string;
  total_matches: number;
  selected_queue_id: number | null;
  queues: Array<{
    queue_id: number;
    queue_name: string;
    stats_scope: PublicStatsScope;
    matches: number;
  }>;
  matches: PresenceDetailMatch[];
  next_cursor: string | null;
}

export async function fetchPresenceDetails(options: {
  queueId?: number;
  cursor?: string;
  limit?: number;
} = {}): Promise<PresenceDetailsResponse> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 25) });
  if (options.queueId != null) params.set('queue_id', String(options.queueId));
  if (options.cursor) params.set('cursor', options.cursor);
  return fetchJson<PresenceDetailsResponse>(`/stats/presence/details?${params.toString()}`);
}

export interface DroppedMatchHourlySummary {
  hour: number;
  tracked: number;
  open: number;
  pending: number;
  staged: number;
  resolved: number;
  dropped: number;
  broken_recovery_pending: number;
  no_authoritative_payload: number;
  no_history_anchor: number;
  partial_history_anchor: number;
  local_ingest_failed: number;
  invalid_payload: number;
  next_retry_at: string | null;
}

export interface DroppedMatchSummaryResponse {
  date: string;
  queue_id: number;
  refreshed: number;
  summary: DroppedMatchHourlySummary[];
}

export async function fetchDroppedMatchSummary(params: { date: string; queueId?: number; refresh?: boolean }): Promise<DroppedMatchSummaryResponse> {
  const query = new URLSearchParams({
    date: params.date,
    queueId: String(params.queueId ?? 486),
  });
  if (params.refresh === false) query.set('refresh', 'false');
  return fetchJson<DroppedMatchSummaryResponse>(`/matches/dropped/summary?${query.toString()}`);
}

export interface DroppedMatchRecord {
  match_id: string;
  date: string;
  hour: number;
  queue_id: number;
  status: string;
  drop_category: string;
  reason: string | null;
  attempts: number;
  observed_players: number;
  updated_at: string | null;
}

export interface DroppedMatchListResponse {
  date: string;
  queue_id: number;
  status: string;
  category: string | null;
  hour: number | null;
  refreshed: number;
  count: number;
  summary: DroppedMatchHourlySummary[];
  matches: DroppedMatchRecord[];
}

export async function fetchDroppedMatches(params: {
  date: string;
  queueId?: number;
  status?: 'dropped' | 'open' | 'all' | 'pending' | 'staged' | 'complete' | 'resolved' | 'unrecoverable';
  hour?: number;
  limit?: number;
  refresh?: boolean;
}): Promise<DroppedMatchListResponse> {
  const query = new URLSearchParams({
    date: params.date,
    queueId: String(params.queueId ?? 486),
    status: params.status ?? 'dropped',
    limit: String(params.limit ?? 500),
  });
  if (params.hour !== undefined) query.set('hour', String(params.hour));
  if (params.refresh === false) query.set('refresh', 'false');
  return fetchJson<DroppedMatchListResponse>(`/matches/dropped?${query.toString()}`);
}

export interface NonrankedDroppedMatchRecord {
  match_id: string;
  date: string;
  hour: number;
  queue_id: number;
  queue_name: string;
  stats_scope: PublicStatsScope;
  region: string;
  quality: string;
  direct_player_count: number;
  roster_player_count: number;
  detail_attempts: number;
  roster_attempts: number;
  terminal_reason: string;
  completed_at: string;
}

export interface NonrankedDroppedMatchResponse {
  date: string | null;
  scope: PublicStatsScope | null;
  hour: number | null;
  count: number;
  summary: Array<{
    date: string;
    hour: number;
    stats_scope: PublicStatsScope;
    queue_id: number;
    queue_name: string;
    dropped: number;
  }>;
  matches: NonrankedDroppedMatchRecord[];
}

export async function fetchNonrankedDroppedMatches(params?: {
  date?: string;
  scope?: PublicStatsScope;
  hour?: number;
  limit?: number;
  offset?: number;
}): Promise<NonrankedDroppedMatchResponse> {
  const query = new URLSearchParams();
  if (params?.date) query.set('date', params.date);
  if (params?.scope) query.set('scope', params.scope);
  if (params?.hour != null) query.set('hour', String(params.hour));
  query.set('limit', String(params?.limit ?? 500));
  if (params?.offset != null) query.set('offset', String(params.offset));
  return fetchJson<NonrankedDroppedMatchResponse>(`/matches/dropped/nonranked?${query.toString()}`);
}

export async function fetchMatchDetail(matchId: number): Promise<MatchDetailWithBans | null> {
  const raw = await fetchJson<{ matches: MatchDetailWithBans[]; count: number; notFound?: number[] }>(
    `/matches/${matchId}`,
    { timeoutMs: 130_000, retries: 0 },
  );
  if (raw.matches.length === 0) return null;
  return deriveMissingMatchCreditRates(raw.matches[0]);
}

export async function fetchMatchFact(matchId: number): Promise<MatchFact | null> {
  try {
    const raw = await fetchJson<MatchFact>(`/matches/fact/${matchId}`);
    return raw;
  } catch {
    return null;
  }
}

export async function fetchMatchSnapshots(matchId: number): Promise<RatingSnapshot[]> {
  const raw = await fetchJson<Array<{
    player_id: number | string;
    player_name: string | null;
    match_id: number | string;
    queue_id?: number | string | null;
    mu_before?: number | string | null;
    phi_before?: number | string | null;
    mu_after?: number | string | null;
    phi_after?: number | string | null;
    mu_change?: number | string | null;
    queue_mu_pre?: number | string | null;
    queue_mu_post?: number | string | null;
    queue_phi_pre?: number | string | null;
    queue_phi_post?: number | string | null;
  }>>(`/ratings/snapshots/${matchId}`);

  return raw.map((r) => {
    // The current backend returns the persisted match_rating_snapshots column
    // names (`queue_mu_pre`, `queue_mu_post`, `queue_phi_pre`, `queue_phi_post`).
    // Older frontend code expected the display names below. Normalize here so
    // the match page remains a pure renderer and so future DB column additions
    // do not make rating rows silently display as blank.
    const muBefore = numberOrNull(r.mu_before) ?? numberOrNull(r.queue_mu_pre);
    const muAfter = numberOrNull(r.mu_after) ?? numberOrNull(r.queue_mu_post);
    const explicitChange = numberOrNull(r.mu_change);
    const muChange = explicitChange ?? (
      muBefore != null && muAfter != null
        ? Math.round((muAfter - muBefore) * 100) / 100
        : null
    );

    return {
      player_id: numberOrNull(r.player_id) ?? 0,
      player_name: r.player_name ?? 'Unknown',
      match_id: numberOrNull(r.match_id) ?? matchId,
      queue_id: numberOrNull(r.queue_id) ?? 0,
      mu_before: muBefore,
      phi_before: numberOrNull(r.phi_before) ?? numberOrNull(r.queue_phi_pre),
      mu_after: muAfter,
      phi_after: numberOrNull(r.phi_after) ?? numberOrNull(r.queue_phi_post),
      mu_change: muChange,
    };
  });
}

export async function fetchRecentMatches(limit?: number): Promise<MatchData[]> {
  const raw = await fetchJson<MatchData[]>(`/matches/recent${limit ? `?limit=${limit}` : ''}`);
  return raw;
}

export interface MatchesOverview {
  hourly: MatchHourlyStats | null;
  recent: MatchData[];
  droppedByHour: Record<string, number>;
  droppedIdsByHour: Record<string, string[]>;
}

const matchesOverviewCache = new Map<string, { value: MatchesOverview; expiresAt: number }>();
const matchesOverviewInFlight = new Map<string, Promise<MatchesOverview>>();

export async function fetchMatchesOverview(params?: {
  tierMin?: number;
  tierMax?: number;
  view?: 'activity-v2' | 'activity-v3';
}): Promise<MatchesOverview> {
  const query = new URLSearchParams();
  if (params?.tierMin != null) query.set('tierMin', String(params.tierMin));
  if (params?.tierMax != null) query.set('tierMax', String(params.tierMax));
  if (params?.view) query.set('view', params.view);
  const cacheKey = query.toString() || 'all';
  const cached = matchesOverviewCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const activeRequest = matchesOverviewInFlight.get(cacheKey);
  if (activeRequest) return activeRequest;
  const request = fetchJson<any>(`/matches/overview${query.toString() ? `?${query.toString()}` : ''}`, { unwrapData: false }).then((raw) => {
    const value: MatchesOverview = {
      hourly: raw.hourly ?? null,
      recent: Array.isArray(raw.recent) ? raw.recent : [],
      droppedByHour: raw.dropped_by_hour ?? {},
      droppedIdsByHour: raw.dropped_ids_by_hour ?? {},
    };
    matchesOverviewCache.set(cacheKey, { value, expiresAt: Date.now() + 60_000 });
    return value;
  });
  matchesOverviewInFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    matchesOverviewInFlight.delete(cacheKey);
  }
}

export async function fetchMatchSearch(params?: {
  championId?: string;
  queueId?: string;
  region?: string;
  date?: string;
  hour?: string;
  timeZone?: string;
  from?: string;
  to?: string;
  page?: string;
  perPage?: string;
}): Promise<{ data: MatchSearchResult[]; total: number; page: { current: number; size: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<{ data: MatchSearchResult[]; total: number; page: { current: number; size: number; totalPages: number } }>(
    `/matches/search${query.toString() ? `?${query.toString()}` : ''}`,
    { unwrapData: false }
  );
  return {
    ...raw,
    data: raw.data.map((match) => ({
      ...match,
      match_id: numberOrNull(match.match_id) ?? 0,
      queue_id: numberOrNull(match.queue_id) ?? 0,
      duration_seconds: numberOrNull(match.duration_seconds) ?? 0,
      champion_id: numberOrNull(match.champion_id) ?? 0,
      kills: numberOrNull(match.kills) ?? 0,
      deaths: numberOrNull(match.deaths) ?? 0,
      assists: numberOrNull(match.assists) ?? 0,
      player_count: numberOrNull(match.player_count) ?? 0,
    })),
  };
}

// ── Reference Data ──

export async function fetchReferenceItems(): Promise<Array<{ item_id: number; name: string; description?: string }>> {
  const raw = await fetchJson<any[]>(`/reference/items`);
  return raw;
}

export async function fetchReferenceTalents(): Promise<Array<{ talent_id: number; name: string; champion_id: number }>> {
  const raw = await fetchJson<any[]>(`/reference/talents`);
  return raw;
}

export async function fetchReferenceCards(): Promise<Array<{ card_id: number; name: string }>> {
  const raw = await fetchJson<any[]>(`/reference/cards`);
  return raw;
}

export async function fetchReferenceQueues(): Promise<Array<{ queue_id: number; name: string }>> {
  const raw = await fetchJson<any[]>(`/reference/queues`);
  return raw;
}

export async function fetchReferenceRegions(): Promise<Array<{ region?: string; region_code?: string; name?: string; region_name?: string }>> {
  const raw = await fetchJson<any[]>(`/reference/regions`);
  return raw;
}

export async function fetchReferenceMaps(): Promise<Array<{ map_id: number; name: string }>> {
  const raw = await fetchJson<any[]>(`/reference/maps`);
  return raw;
}

export async function fetchReferenceChampions(): Promise<Array<{ id: number; name: string }>> {
  const raw = await fetchJson<any[]>(`/reference/champions`);
  return raw;
}


