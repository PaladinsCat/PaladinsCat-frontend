const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

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
  player_id: number;
  name: string;
  tier: number;
  points: number;
  prev_rank?: number | null;
  trend?: number;
}

export async function fetchRankedLeaderboard(params?: { tier?: string; top?: number }): Promise<RankedPlayer[]> {
  const query = new URLSearchParams();
  if (params?.tier) query.set('tier', params.tier);
  if (params?.top != null) query.set('top', String(params.top));
  return fetchJson<RankedPlayer[]>(`/stats/ranked-leaderboard${query.toString() ? `?${query.toString()}` : ''}`);
}

export interface CheaterPlayer {
  id: string;
  name: string;
  platform: string;
  region: string;
  kbmTier: string | null;
  cheater: boolean;
  susCount: number;
  avgDpm: number | null;
  avgHpm: number | null;
  avgGpm: number | null;
  avgMpm: number | null;
  totalMatches: number;
  winRate: number | null;
}

export async function fetchCheaterPlayers(params?: { cheater?: boolean; susOnly?: boolean; limit?: number }): Promise<CheaterPlayer[]> {
  const query = new URLSearchParams();
  if (params?.cheater) query.set('cheater', 'true');
  if (params?.susOnly) query.set('susOnly', 'true');
  if (params?.limit) query.set('limit', String(params.limit));
  query.set('perPage', String(params?.limit || 100));
  try {
    const raw = await fetchJson<Array<{
      id: string; name: string; platform: string; region: string;
      kbm_tier?: string | null; cheater?: boolean; sus_count?: number;
      avg_dpm?: number | null; avg_hpm?: number | null; avg_egpm?: number | null;
      avg_mpm?: number | null; total_matches?: number; win_rate?: number | null;
    }>>(`/players/search?${query.toString()}`);
    return raw.map(r => ({
      id: r.id, name: r.name, platform: r.platform, region: r.region,
      kbmTier: r.kbm_tier ?? null, cheater: r.cheater ?? false,
      susCount: r.sus_count ?? 0,
      avgDpm: r.avg_dpm ?? null, avgHpm: r.avg_hpm ?? null,
      avgGpm: r.avg_egpm ?? null, avgMpm: r.avg_mpm ?? null,
      totalMatches: r.total_matches ?? 0, winRate: r.win_rate ?? null,
    }));
  } catch {
    return [];
  }
}

export interface ClassLeaderboardEntry {
  rank: number;
  playerId: number;
  playerName: string;
  championName: string;
  championId: number;
  elo: number;
  mu: number;
  phi: number;
  winRate: number | null;
  totalMatches: number;
  totalWins: number;
  region: string | null;
}

export async function fetchClassLeaderboard(params: { role: string; limit?: number; queueId?: number }): Promise<ClassLeaderboardEntry[]> {
  const query = new URLSearchParams();
  query.set('role', params.role);
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.queueId != null) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Array<{
      rank: number; player_id: number; player_name: string;
      champion_name: string; champion_id: number;
      elo: number | string; mu: number | string; phi: number | string;
      win_rate: number | string | null; total_matches: number; total_wins: number;
      region: string | null;
    }>>(`/players/leaderboard/class?${query.toString()}`);
    return raw.map((r) => ({
      rank: r.rank,
      playerId: Number(r.player_id),
      playerName: r.player_name,
      championName: r.champion_name,
      championId: r.champion_id,
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

export interface PerformanceLeaderboardEntry {
  rank: number;
  playerId: number;
  playerName: string;
  championName: string | null;
  championId: number | null;
  className: string | null;
  value: number;
  totalMatches: number;
  region: string | null;
  platform: string | null;
}

export async function fetchPerformanceLeaderboard(params: {
  metric: 'dpm' | 'hpm' | 'gpm' | 'mpm';
  limit?: number;
  role?: string;
  region?: string;
  queueId?: number;
}): Promise<PerformanceLeaderboardEntry[]> {
  const query = new URLSearchParams();
  query.set('metric', params.metric);
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.role) query.set('role', params.role);
  if (params.region) query.set('region', params.region);
  if (params.queueId != null) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Array<{
      rank: number; player_id: number; player_name: string;
      champion_name: string | null; champion_id: number | null; class_name: string | null;
      value: number | string; total_matches: number; region: string | null; platform: string | null;
    }>>(`/players/leaderboard/performance?${query.toString()}`);
    return raw.map((r) => ({
      rank: r.rank,
      playerId: Number(r.player_id),
      playerName: r.player_name,
      championName: r.champion_name ?? null,
      championId: r.champion_id ?? null,
      className: r.class_name ?? null,
      value: typeof r.value === 'string' ? Number(r.value) : r.value,
      totalMatches: Number(r.total_matches ?? 0),
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

export type PerformanceMetricKey = 'dpm' | 'hpm' | 'gpm' | 'mpm' | 'kda';

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
}): Promise<PerformanceMetricsResponse> {
  const query = new URLSearchParams();
  if (params?.metric) query.set('metric', params.metric);
  if (params?.role) query.set('role', params.role);
  if (params?.queueId != null) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Record<string, any>>(`/stats/performance-metrics${query.toString() ? `?${query.toString()}` : ''}`);
    return Object.fromEntries(
      Object.entries(raw).map(([metric, summary]) => [metric, mapMetricSummary(summary)])
    ) as PerformanceMetricsResponse;
  } catch {
    return {};
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
      median: number | string; mode: number | string; avg_value: number | string;
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
  avgGpm: number;
  avgDpm: number;
  avgHpm: number;
  avgShpm: number;
  avgMpm: number;
  avgKda: number;
  p10Gpm: number;
  p90Gpm: number;
  p10Dpm: number;
  p90Dpm: number;
  sampleSize: number;
}

export async function fetchBaselines(params?: { role?: string; queueId?: number }): Promise<BaselineEntry[]> {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.queueId) query.set('queueId', String(params.queueId));
  try {
    const raw = await fetchJson<Array<{
      role: string; queue_id: number;
      avg_gpm: number; avg_dpm: number; avg_hpm: number;
      avg_shpm: number; avg_mpm: number; avg_kda: number;
      p10_gpm: number; p90_gpm: number; p10_dpm: number; p90_dpm: number;
      sample_size: number;
    }>>(`/stats/baselines${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map(r => ({
      role: r.role, queueId: r.queue_id,
      avgGpm: r.avg_gpm, avgDpm: r.avg_dpm, avgHpm: r.avg_hpm,
      avgShpm: r.avg_shpm, avgMpm: r.avg_mpm, avgKda: r.avg_kda,
      p10Gpm: r.p10_gpm, p90Gpm: r.p90_gpm, p10Dpm: r.p10_dpm, p90Dpm: r.p90_dpm,
      sampleSize: r.sample_size,
    }));
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
}

export interface TierStat {
  tier: string;
  tierSort: number;
  totalPlays: number;
  avgWinRate: number;
}

// ── Fetch helpers ──

/**
 * Fetch timeout (ms). Without it, a stalled backend connection causes the
 * frontend to wait indefinitely — especially bad on mobile/slow networks.
 * 10 seconds is generous for API calls; if it takes longer, the connection
 * is likely dead and we should fail fast and retry.
 */
const FETCH_TIMEOUT_MS = 10000;

async function fetchJson<T>(path: string, options?: RequestInit & { retries?: number }): Promise<T> {
  const retries = options?.retries ?? 2;
  const fetchOptions: RequestInit = { ...options };
  delete (fetchOptions as any).retries;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // CRITICAL: Add timeout to prevent indefinite hang on stalled backend.
    // AbortSignal.timeout() cancels the fetch if it exceeds the limit.
    // Source: Fault #1 — "No timeout on fetch()"
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.message || `API ${res.status} on ${path}`);
    }
    const json = await res.json();
    // Handle { data, meta } wrapper from backend API
    if (json && json.data !== undefined) {
      return json.data as T;
    }
    return json as T;
  }
  throw new Error("Unexpected fetch failure");
}

// ── Champions ──

export async function fetchChampions(params?: {
  limit?: string;
  offset?: string;
  tier?: string;
  region?: string;
  patch?: string;
}): Promise<Champion[]> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
  }
  const raw = await fetchJson<Array<{
    id: number;
    name: string;
    roles?: string;
    title?: string;
    health?: number;
    speed?: number;
    image_path?: string | null;
  }>>(`/champions${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r): Champion => ({
    id: r.id,
    name: r.name,
    roles: r.roles ? r.roles.split(',').map(s => s.trim()).filter(Boolean) : null,
    winRate: null,
    pickRate: null,
    banRate: null,
    rating: null,
    ratingDeviation: null,
    volatility: null,
    totalMatches: null,
    totalPlays: null,
    wins: null,
    imagePath: r.image_path || null,
  }));
}

export async function fetchTopWinrate(): Promise<TopWinrateEntry[]> {
  const res = await fetch(`${API_BASE}/champions/top-winrate`);
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

export async function fetchPlayerProfile(id: string): Promise<PlayerProfile> {
  const raw = await fetchJson<{
    id: string;
    name: string;
    platform: string;
    region: string;
    kbm_tier: string | null;
    kbm_points: number | null;
    total_matches: number;
    total_wins: number;
    win_rate: number | null;
    total_plays: number;
    top_champions: Array<{ champion_name: string; champion_id: number; wins: number; total_plays: number; win_rate: number }>;
  }>(`/players/${id}`);

  return {
    id: raw.id,
    name: raw.name,
    platform: raw.platform,
    region: raw.region,
    kbmTier: raw.kbm_tier,
    kbmPoints: raw.kbm_points,
    totalMatches: raw.total_matches,
    totalWins: raw.total_wins,
    winRate: raw.win_rate,
    totalPlays: raw.total_plays,
    topChampions: raw.top_champions.map((c) => ({
      championName: c.champion_name,
      championId: c.champion_id,
      wins: c.wins,
      totalPlays: c.total_plays,
      winRate: c.win_rate,
    })),
  };
}

export async function fetchPlayerSearch(query: string): Promise<PlayerSearchResult[]> {
  const raw = await fetchJson<Array<{
    id: string;
    name: string;
    platform: string;
    region: string;
    kbm_tier: string | null;
  }>>(`/players/search/${encodeURIComponent(query)}`);

  return raw.map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform,
    region: r.region,
    kbmTier: r.kbm_tier,
  }));
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
    damage_done: number;
    duration: number;
    map_game: string;
    entry_datetime: string;
  }>>(`/players/${id}/matches${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((m) => ({
    matchId: m.match_id,
    championName: m.champion_name,
    isWinner: m.win_status === 'Winner',
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    damageDone: m.damage_done,
    duration: m.duration,
    mapGame: m.map_game,
    entryDatetime: m.entry_datetime,
  }));
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
}

export async function fetchStatsChampions(params?: { sort?: string; limit?: number }): Promise<StatsChampion[]> {
  const query = new URLSearchParams();
  if (params?.sort) query.set('sort', params.sort);
  if (params?.limit != null) query.set('limit', String(params.limit));
  const raw = await fetchJson<Array<{
    champion_id: number;
    champion_name: string;
    win_rate: number | string;
    total_plays: number | string;
    ban_rate?: number | string;
  }>>(`/stats/champions${query.toString() ? `?${query.toString()}` : ''}`);
  return raw.map((r) => ({
    championId: r.champion_id,
    championName: r.champion_name,
    winRate: typeof r.win_rate === 'string' ? Number(r.win_rate) : r.win_rate,
    totalPlays: typeof r.total_plays === 'string' ? Number(r.total_plays) : r.total_plays,
    banRate: r.ban_rate != null ? (typeof r.ban_rate === 'string' ? Number(r.ban_rate) : r.ban_rate) as number | undefined : undefined,
  }));
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
    champion_id: number;
    champion_name: string;
    total_matches: number;
    win_rate: number;
    avg_dpm: number;
    avg_hpm: number;
  }>>(`/stats/platforms`);

  return raw.map((r) => ({
    platform: r.platform,
    championId: r.champion_id,
    championName: r.champion_name,
    totalMatches: r.total_matches,
    winRate: r.win_rate,
    avgDpm: r.avg_dpm,
    avgHpm: r.avg_hpm,
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
    champion_id: number;
    champion_name: string;
    total_matches: number;
    total_uses: number;
    wins: number;
    losses: number;
    win_rate: number;
    ranked_wins: number;
    ranked_win_rate: number;
    high_tier_wins: number;
    high_tier_win_rate: number;
    avg_kills: number;
    avg_deaths: number;
    avg_assists: number;
    avg_dpm: number;
    avg_hpm: number;
    loadout_items: Array<{ item_name: string; usage_rate: number }> | null;
    last_refreshed: string;
  }>>(`/stats/loadouts${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r) => ({
    deckHash: r.deck_hash,
    championId: r.champion_id,
    championName: r.champion_name,
    totalMatches: r.total_matches,
    totalUses: r.total_uses,
    wins: r.wins,
    losses: r.losses,
    winRate: r.win_rate,
    rankedWins: r.ranked_wins,
    rankedWinRate: r.ranked_win_rate,
    highTierWins: r.high_tier_wins,
    highTierWinRate: r.high_tier_win_rate,
    avgKills: r.avg_kills,
    avgDeaths: r.avg_deaths,
    avgAssists: r.avg_assists,
    avgDpm: r.avg_dpm,
    avgHpm: r.avg_hpm,
    loadoutItems: r.loadout_items,
    lastRefreshed: r.last_refreshed,
  }));
}

export async function fetchItems(): Promise<ItemStat[]> {
  const raw = await fetchJson<Array<{
    item_id: number;
    item_name: string;
    total_usage: number;
    win_rate: number;
  }>>(`/stats/items`);

  return raw.map((r) => ({
    itemId: r.item_id,
    itemName: r.item_name,
    totalUsage: r.total_usage,
    winRate: r.win_rate,
  }));
}

export async function fetchTiers(): Promise<TierStat[]> {
  const raw = await fetchJson<Array<{
    tier: string;
    tier_sort: number;
    total_plays: number;
    avg_win_rate: number;
  }>>(`/stats/tiers`);

  return raw.map((r) => ({
    tier: r.tier,
    tierSort: r.tier_sort,
    totalPlays: r.total_plays,
    avgWinRate: r.avg_win_rate,
  }));
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
    talent_id: number;
    talent_name: string;
    champion_id: number;
    champion_name: string;
    total_plays: number;
    win_rate: number;
  }>>(`/stats/talents`);

  return raw.map((r) => ({
    talentId: r.talent_id,
    talentName: r.talent_name,
    championId: r.champion_id,
    championName: r.champion_name,
    totalPlays: r.total_plays,
    winRate: r.win_rate,
  }));
}

// ── Auth Types ──

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  lastLogin: string | null;
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
    user: { id: number; username: string; email: string; avatar_url: string | null; bio: string | null; created_at: string; last_login: string | null };
    token: string;
    expires_at: string;
  }>(`/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const session: AuthSession = {
    user: {
      id: raw.user.id,
      username: raw.user.username,
      email: raw.user.email,
      avatarUrl: raw.user.avatar_url,
      bio: raw.user.bio,
      createdAt: raw.user.created_at,
      lastLogin: raw.user.last_login,
    },
    token: raw.token,
    expiresAt: raw.expires_at,
  };

  setAuthSession(session);
  return session;
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const raw = await fetchJson<{
    user: { id: number; username: string; email: string; avatar_url: string | null; bio: string | null; created_at: string; last_login: string | null };
    token: string;
    expires_at: string;
  }>(`/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const session: AuthSession = {
    user: {
      id: raw.user.id,
      username: raw.user.username,
      email: raw.user.email,
      avatarUrl: raw.user.avatar_url,
      bio: raw.user.bio,
      createdAt: raw.user.created_at,
      lastLogin: raw.user.last_login,
    },
    token: raw.token,
    expiresAt: raw.expires_at,
  };

  setAuthSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    // CRITICAL: Send token in Authorization header. The backend auth routes
    // expect the token in the header (see backend routes/auth.ts). Sending it
    // in the body means the backend never finds it → session never invalidated.
    // Source: Fault #3 — "Logout sends token in body, backend expects header"
    await fetchJson<unknown>(`/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    });
  }
  clearAuth();
}

export async function getMe(userId: number): Promise<AuthUser> {
  // CRITICAL: Send userId in body, not URL. URL params are logged in server
  // access logs, browser history, and proxy logs. The body is not logged.
  // Source: Fault #4 — "User ID exposed in URL parameter"
  const raw = await fetchJson<{
    id: number;
    username: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    last_login: string | null;
  }>(`/v1/auth/me`, {
    body: JSON.stringify({ user_id: userId }),
  });

  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    bio: raw.bio,
    createdAt: raw.created_at,
    lastLogin: raw.last_login,
  };
}

export async function getUserProfile(userId: number): Promise<AuthUser> {
  const raw = await fetchJson<{
    id: number;
    username: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    last_login: string | null;
  }>(`/v1/auth/users/${userId}`);

  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    bio: raw.bio,
    createdAt: raw.created_at,
    lastLogin: raw.last_login,
  };
}

// ── Community Types ──

export interface Post {
  id: number;
  userId: number;
  username: string;
  title: string;
  content: string;
  buildId: number | null;
  likes: number;
  viewCount: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  username: string;
  parentId: number | null;
  content: string;
  createdAt: string;
}

export interface PostDetail {
  post: Post;
  comments: Comment[];
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
  const raw = await fetchJson<Array<{
    id: number;
    user_id: number;
    username: string;
    title: string;
    content: string;
    build_id: number | null;
    likes: number;
    view_count: number;
    created_at: string;
  }>>(`/v1/posts${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r) => ({
    id: r.id,
    userId: r.user_id,
    username: r.username,
    title: r.title,
    content: r.content,
    buildId: r.build_id,
    likes: r.likes,
    viewCount: r.view_count,
    createdAt: r.created_at,
  }));
}

export async function createPost(userId: number, title: string, content: string, buildId: number | null, token: string): Promise<Post> {
  const raw = await fetchJson<{
    id: number;
    user_id: number;
    username: string;
    title: string;
    content: string;
    build_id: number | null;
    likes: number;
    view_count: number;
    created_at: string;
  }>(`/v1/posts/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId, title, content, build_id: buildId }),
  });

  return {
    id: raw.id,
    userId: raw.user_id,
    username: raw.username,
    title: raw.title,
    content: raw.content,
    buildId: raw.build_id,
    likes: raw.likes,
    viewCount: raw.view_count,
    createdAt: raw.created_at,
  };
}

export async function getPostDetail(postId: number): Promise<PostDetail> {
  const raw = await fetchJson<{
    post: {
      id: number;
      user_id: number;
      username: string;
      title: string;
      content: string;
      build_id: number | null;
      likes: number;
      view_count: number;
      created_at: string;
    };
    comments: Array<{
      id: number;
      post_id: number;
      user_id: number;
      username: string;
      parent_id: number | null;
      content: string;
      created_at: string;
    }>;
  }>(`/v1/posts/${postId}`);

  return {
    post: {
      id: raw.post.id,
      userId: raw.post.user_id,
      username: raw.post.username,
      title: raw.post.title,
      content: raw.post.content,
      buildId: raw.post.build_id,
      likes: raw.post.likes,
      viewCount: raw.post.view_count,
      createdAt: raw.post.created_at,
    },
    comments: raw.comments.map((c) => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      username: c.username,
      parentId: c.parent_id,
      content: c.content,
      createdAt: c.created_at,
    })),
  };
}

export async function addComment(postId: number, userId: number, content: string, parentId: number | null, token: string): Promise<Comment> {
  const raw = await fetchJson<{
    id: number;
    post_id: number;
    user_id: number;
    username: string;
    parent_id: number | null;
    content: string;
    created_at: string;
  }>(`/v1/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId, content, parent_id: parentId }),
  });

  return {
    id: raw.id,
    postId: raw.post_id,
    userId: raw.user_id,
    username: raw.username,
    parentId: raw.parent_id,
    content: raw.content,
    createdAt: raw.created_at,
  };
}

export async function togglePostLike(postId: number, userId: number, token: string): Promise<number> {
  const raw = await fetchJson<{ likes: number }>(`/v1/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId }),
  });

  return raw.likes;
}

// ── Build Types ──

export interface Build {
  id: number;
  userId: number;
  username: string;
  championId: number;
  championName: string;
  name: string;
  items: number[];
  actives: number[];
  talents: number[];
  notes: string | null;
  visibility: string;
  likes: number;
  viewCount: number;
  createdAt: string;
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
  const raw = await fetchJson<Array<{
    id: number;
    user_id: number;
    username: string;
    champion_id: number;
    champion_name: string;
    name: string;
    items: number[];
    actives: number[];
    talents: number[];
    notes: string | null;
    visibility: string;
    likes: number;
    view_count: number;
    created_at: string;
  }>>(`/v1/builds${query.toString() ? `?${query.toString()}` : ''}`);

  return raw.map((r) => ({
    id: r.id,
    userId: r.user_id,
    username: r.username,
    championId: r.champion_id,
    championName: r.champion_name,
    name: r.name,
    items: r.items,
    actives: r.actives,
    talents: r.talents,
    notes: r.notes,
    visibility: r.visibility,
    likes: r.likes,
    viewCount: r.view_count,
    createdAt: r.created_at,
  }));
}

export async function createBuild(userId: number, championId: number, name: string, items: number[], actives: number[], talents: number[], notes: string | null, visibility: string, token: string): Promise<Build> {
  const raw = await fetchJson<{
    id: number;
    user_id: number;
    username: string;
    champion_id: number;
    champion_name: string;
    name: string;
    items: number[];
    actives: number[];
    talents: number[];
    notes: string | null;
    visibility: string;
    likes: number;
    view_count: number;
    created_at: string;
  }>(`/v1/builds/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId, champion_id: championId, name, items, actives, talents, notes, visibility }),
  });

  return {
    id: raw.id,
    userId: raw.user_id,
    username: raw.username,
    championId: raw.champion_id,
    championName: raw.champion_name,
    name: raw.name,
    items: raw.items,
    actives: raw.actives,
    talents: raw.talents,
    notes: raw.notes,
    visibility: raw.visibility,
    likes: raw.likes,
    viewCount: raw.view_count,
    createdAt: raw.created_at,
  };
}

export async function getBuildDetail(buildId: number): Promise<Build> {
  const raw = await fetchJson<{
    id: number;
    user_id: number;
    username: string;
    champion_id: number;
    champion_name: string;
    name: string;
    items: number[];
    actives: number[];
    talents: number[];
    notes: string | null;
    visibility: string;
    likes: number;
    view_count: number;
    created_at: string;
  }>(`/v1/builds/${buildId}`);

  return {
    id: raw.id,
    userId: raw.user_id,
    username: raw.username,
    championId: raw.champion_id,
    championName: raw.champion_name,
    name: raw.name,
    items: raw.items,
    actives: raw.actives,
    talents: raw.talents,
    notes: raw.notes,
    visibility: raw.visibility,
    likes: raw.likes,
    viewCount: raw.view_count,
    createdAt: raw.created_at,
  };
}

export async function toggleBuildLike(buildId: number, userId: number, token: string): Promise<number> {
  const raw = await fetchJson<{ likes: number }>(`/v1/builds/${buildId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId }),
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

export async function fetchKdaHistory(playerId: string, days: number = 30, limit: number = 50): Promise<KdaHistoryEntry[]> {
  const raw = await fetchJson<Array<{
    date: string;
    kills: number;
    deaths: number;
    assists: number;
  }>>(`/v1/stats/player/${encodeURIComponent(playerId)}/kda-history?days=${days}&limit=${limit}`);

  return raw.map((r) => ({
    date: r.date,
    kills: r.kills,
    deaths: r.deaths,
    assists: r.assists,
  }));
}

export async function fetchDpmHistory(playerId: string, days: number = 30, limit: number = 50): Promise<DpmHistoryEntry[]> {
  const raw = await fetchJson<Array<{
    date: string;
    player_dpm: number;
    avg_dpm: number;
  }>>(`/v1/stats/player/${encodeURIComponent(playerId)}/dpm-history?days=${days}&limit=${limit}`);

  return raw.map((r) => ({
    date: r.date,
    playerDpm: r.player_dpm,
    avgDpm: r.avg_dpm,
  }));
}

export async function fetchGlickoHistory(playerId: string, days: number = 30, limit: number = 50): Promise<GlickoHistoryEntry[]> {
  const raw = await fetchJson<Array<{
    date: string;
    rating: number;
  }>>(`/v1/stats/player/${encodeURIComponent(playerId)}/glicko-history?days=${days}&limit=${limit}`);

  return raw.map((r) => ({
    date: r.date,
    rating: r.rating,
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
  champion_id: number;
  champion_name: string;
  skin_id: number;
  skin_name: string;
  kills: number;
  deaths: number;
  assists: number;
  damage_done_physical: number;
  damage_done_magical: number;
  gold_earned: number;
  win_status: string;
  task_force: number;
  league_tier: string | null;
  kda: number;
  damage_per_minute: number;
  healing_per_minute: number;
  healing_self_per_minute: number;
  time_in_match: number;
  afk_rate: number;
}

export interface MatchBan {
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
  team1_score: number;
  team2_score: number;
  winning_task_force: number;
  is_ranked: boolean;
  recovered: boolean;
  broken: boolean;
  private: boolean;
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

export interface MatchFactPlayer {
  player_id: number;
  player_name: string;
  items: Array<{ item_id: number; slot: number }>;
  cards: Array<{ card_id: number }>;
  talents: Array<{ talent_id: number }>;
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
  mu_before: number;
  phi_before: number;
  mu_after: number;
  phi_after: number;
  mu_change: number;
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

export async function fetchMatchDetail(matchId: number): Promise<MatchDetailWithBans | null> {
  const raw = await fetchJson<{ matches: MatchDetailWithBans[]; count: number; notFound?: number[] }>(`/matches/${matchId}`);
  if (raw.matches.length === 0) return null;
  return raw.matches[0];
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
  const raw = await fetchJson<RatingSnapshot[]>(`/ratings/snapshots/${matchId}`);
  return raw;
}

export async function fetchRecentMatches(limit?: number): Promise<MatchData[]> {
  const raw = await fetchJson<MatchData[]>(`/matches/recent${limit ? `?limit=${limit}` : ''}`);
  return raw;
}

export async function fetchMatchSearch(params?: {
  championId?: string;
  queueId?: string;
  region?: string;
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
  const raw = await fetchJson<{ data: MatchSearchResult[]; total: number; page: { current: number; size: number; totalPages: number } }>(`/matches/search${query.toString() ? `?${query.toString()}` : ''}`);
  return raw;
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

export async function fetchReferenceMaps(): Promise<Array<{ map_id: number; name: string }>> {
  const raw = await fetchJson<any[]>(`/reference/maps`);
  return raw;
}

export async function fetchReferenceChampions(): Promise<Array<{ id: number; name: string }>> {
  const raw = await fetchJson<any[]>(`/reference/champions`);
  return raw;
}
