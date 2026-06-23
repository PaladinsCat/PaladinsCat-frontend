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
      totalMatches: Number(r.total_matches) || 0, winRate: r.win_rate != null ? Number(r.win_rate) : null,
    }));
  } catch {
    return [];
  }
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
      rank: Number(r.rank),
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
      avgGpm: Number(r.avg_gpm ?? 0), avgDpm: Number(r.avg_dpm ?? 0), avgHpm: Number(r.avg_hpm ?? 0),
      avgShpm: Number(r.avg_shpm ?? 0), avgMpm: Number(r.avg_mpm ?? 0), avgKda: Number(r.avg_kda ?? 0),
      p10Gpm: Number(r.p10_gpm ?? 0), p90Gpm: Number(r.p90_gpm ?? 0), p10Dpm: Number(r.p10_dpm ?? 0), p90Dpm: Number(r.p90_dpm ?? 0),
      sampleSize: Number(r.sample_size ?? 0),
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

export interface MapStat {
  name: string;
  totalMatches: number;
  avgDurationSeconds: number;
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

export interface Notification {
  id: number;
  timestamp: string;
  importance: number;
  message: string;
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
}

export interface ChangelogPage {
  data: ChangelogEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
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
 * Fetch timeout (ms). Without it, a stalled backend connection causes the
 * frontend to wait indefinitely — especially bad on mobile/slow networks.
 * 10 seconds is generous for API calls; if it takes longer, the connection
 * is likely dead and we should fail fast and retry.
 */
const FETCH_TIMEOUT_MS = 10000;

async function fetchJson<T>(path: string, options?: RequestInit & { retries?: number; unwrapData?: boolean }): Promise<T> {
  const retries = options?.retries ?? 2;
  const unwrapData = options?.unwrapData ?? true;
  const fetchOptions: RequestInit = { ...options };
  delete (fetchOptions as any).retries;
  delete (fetchOptions as any).unwrapData;

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
      const message = typeof errBody?.error === "string" ? errBody.error : errBody?.error?.message;
      throw new Error(message || `API ${res.status} on ${path}`);
    }
    const json = await res.json();
    // Handle normalized list envelopes when callers only need the rows.
    if (unwrapData && json && json.data !== undefined) {
      return json.data as T;
    }
    return json as T;
  }
  throw new Error("Unexpected fetch failure");
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

function mapNotification(raw: {
  id: number;
  timestamp?: string;
  importance?: number | string;
  message: string;
}): Notification {
  return {
    id: raw.id,
    timestamp: raw.timestamp ?? "",
    importance: Number(raw.importance ?? 0),
    message: raw.message,
  };
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

export async function fetchAdminNotifications(token: string): Promise<Notification[]> {
  const raw = await fetchJson<any[]>(
    `/admin/notifications`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return raw.map(mapNotification);
}

export async function createAdminNotification(token: string, input: NotificationInput): Promise<Notification> {
  const raw = await fetchJson<any>(`/admin/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return mapNotification(raw);
}

export async function updateAdminNotification(token: string, id: number, input: Partial<NotificationInput>): Promise<Notification> {
  const raw = await fetchJson<any>(`/admin/notifications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  return mapNotification(raw);
}

export async function deleteAdminNotification(token: string, id: number): Promise<void> {
  await fetchJson<{ deleted: boolean; id: number }>(`/admin/notifications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Changelog ──

export async function fetchChangelogPreview(): Promise<ChangelogEntry | null> {
  try {
    const raw = await fetchJson<any>('/meta/changelog?preview=true');
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
    const raw = await fetchJson<any>(`/meta/changelog${query.toString() ? `?${query.toString()}` : ''}`);
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

function mapChangelogEntry(raw: any): ChangelogEntry {
  return {
    id: Number(raw?.id ?? 0),
    version: String(raw?.version ?? ''),
    gitCommit: String(raw?.gitCommit ?? ''),
    gitCommitShort: String(raw?.gitCommitShort ?? ''),
    gitBranch: raw?.gitBranch ?? null,
    deployedAt: raw?.deployedAt ?? null,
    source: raw?.source ?? null,
    changelog: String(raw?.changelog ?? ''),
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
    const raw = await fetchJson<any>(`/meta/version`, { retries: 0 });
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
  const [raw, stats] = await Promise.all([
    fetchJson<Array<{
    id: number;
    name: string;
    roles?: string;
    title?: string;
    health?: number;
    speed?: number;
    image_path?: string | null;
  }>>(`/champions${query.toString() ? `?${query.toString()}` : ''}`),
    fetchStatsChampions({ limit: 200 }).catch(() => [] as StatsChampion[]),
  ]);
  const statsById = new Map(stats.map((stat) => [stat.championId, stat]));
  const statsByName = new Map(stats.map((stat) => [stat.championName.toLowerCase(), stat]));
  const statsBySlug = new Map(stats.map((stat) => [championSlug(stat.championName), stat]));

  return raw.map((r): Champion => {
    // Prefer the immutable champion id, then exact canonical name, then route
    // slug. The slug fallback protects punctuation drift such as Mal'Damba vs
    // Mal Damba while still avoiding fuzzy matches that could merge wrong rows.
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
      rating: null,
      ratingDeviation: null,
      volatility: null,
      totalMatches: stat?.totalPlays ?? null,
      totalPlays: stat?.totalPlays ?? null,
      wins: null,
      imagePath: r.image_path || null,
    };
  });
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
  pickRate?: number;
  kda?: number;
  avgDamage?: number;
  avgGold?: number;
  avgHeal?: number;
  avgMitigation?: number;
}

export async function fetchStatsChampions(params?: { sort?: string; limit?: number }): Promise<StatsChampion[]> {
  const query = new URLSearchParams();
  if (params?.sort) query.set('sort', params.sort);
  if (params?.limit != null) query.set('limit', String(params.limit));
  try {
    const raw = await fetchJson<Array<{
      champion_id: number; champion_name: string;
      win_rate: number | string; total_matches?: number | string; total_plays?: number | string;
      ban_rate?: number | string; pick_rate?: number | string; kda?: number | string;
      avg_damage?: number | string; avg_gold?: number | string;
      avg_heal?: number | string; avg_mitigation?: number | string;
    }>>(`/stats/champions${query.toString() ? `?${query.toString()}` : ''}`);
    const num = (v: number | string | undefined) => v != null ? (typeof v === 'string' ? Number(v) : v) : undefined;
    return raw.map((r) => ({
      championId: r.champion_id,
      championName: r.champion_name,
      winRate: toDisplayPercent(r.win_rate) ?? 0,
      totalPlays: num(r.total_matches) ?? num(r.total_plays) ?? 0,
      banRate: toDisplayPercent(r.ban_rate) ?? undefined,
      pickRate: toDisplayPercent(r.pick_rate) ?? undefined,
      kda: num(r.kda),
      avgDamage: num(r.avg_damage),
      avgGold: num(r.avg_gold),
      avgHeal: num(r.avg_heal),
      avgMitigation: num(r.avg_mitigation),
    }));
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

export async function fetchItems(params?: { mode?: string; limit?: number }): Promise<ItemStat[]> {
  const query = new URLSearchParams();
  if (params?.mode) query.set('mode', params.mode);
  if (params?.limit != null) query.set('limit', String(params.limit));
  try {
    const raw = await fetchJson<Array<{
      item_id: number; item_name: string;
      total_uses?: number | string; total_usage?: number | string;
      win_rate: number | string;
    }>>(`/stats/items${query.toString() ? `?${query.toString()}` : ''}`);
    const num = (v: number | string | undefined) => v != null ? (typeof v === 'string' ? Number(v) : v) : 0;
    return raw.map((r) => ({
      itemId: r.item_id,
      itemName: r.item_name,
      totalUsage: num(r.total_uses) || num(r.total_usage),
      winRate: num(r.win_rate),
    }));
  } catch {
    return [];
  }
}

export async function fetchMapStats(params?: { queueId?: number; limit?: number }): Promise<MapStat[]> {
  const query = new URLSearchParams();
  if (params?.queueId != null) query.set('queueId', String(params.queueId));
  if (params?.limit != null) query.set('limit', String(params.limit));
  try {
    const raw = await fetchJson<Array<{
      map: string;
      total_matches: number | string;
      avg_duration_seconds: number | string;
    }>>(`/stats/maps${query.toString() ? `?${query.toString()}` : ''}`);
    return raw.map((r) => ({
      name: r.map,
      totalMatches: Number(r.total_matches ?? 0),
      avgDurationSeconds: Number(r.avg_duration_seconds ?? 0),
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
  talents: ChampionTalentStat[];
}

export async function fetchChampionTalentStats(
  championId: number,
  mode: 'ranked' | 'casual' = 'ranked'
): Promise<ChampionTalentStatsResponse> {
  try {
    const raw = await fetchJson<{
      totalMatches: number | string;
      talents: Array<{
        talentId: number | string;
        talentName: string;
        totalPlays: number | string;
        wins: number | string;
        losses: number | string;
        winRate: number | string;
      }>;
    }>(`/stats/talents/${championId}?mode=${mode}`);

    return {
      totalMatches: Number(raw.totalMatches) ?? 0,
      talents: (raw.talents ?? []).map((t) => ({
        talentId: Number(t.talentId) ?? 0,
        talentName: t.talentName ?? 'Unknown',
        totalPlays: Number(t.totalPlays) ?? 0,
        wins: Number(t.wins) ?? 0,
        losses: Number(t.losses) ?? 0,
        winRate: toDisplayPercent(t.winRate) ?? 0,
      })),
    };
  } catch {
    return { totalMatches: 0, talents: [] };
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

export async function fetchChampionCardStats(
  championId: number,
  mode: 'ranked' | 'casual' = 'ranked'
): Promise<ChampionCardStatsResponse> {
  try {
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
    }>(`/stats/cards/${championId}?mode=${mode}`);

    return {
      totalMatches: Number(raw.totalMatches) ?? 0,
      cards: (raw.cards ?? []).map((c) => ({
        cardId: Number(c.cardId) ?? 0,
        cardName: c.cardName ?? 'Unknown',
        totalPlays: Number(c.totalPlays) ?? 0,
        wins: Number(c.wins) ?? 0,
        losses: Number(c.losses) ?? 0,
        winRate: toDisplayPercent(c.winRate) ?? 0,
        levels: (c.levels ?? []).map((l) => ({
          level: Number(l.level) ?? 0,
          plays: Number(l.plays) ?? 0,
          winRate: toDisplayPercent(l.winRate) ?? 0,
        })),
      })),
    };
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
    user: { id: number; username: string; email?: string | null; avatar_url?: string | null; bio?: string | null; is_admin?: boolean; is_approved?: boolean; created_at?: string; last_login?: string | null };
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
    },
    token: raw.token,
    expiresAt: raw.expires_at ?? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  };

  setAuthSession(session);
  return session;
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const raw = await fetchJson<{
    user: { id: number; username: string; email?: string | null; avatar_url?: string | null; bio?: string | null; is_admin?: boolean; is_approved?: boolean; created_at?: string; last_login?: string | null };
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
    throw new Error("Not authenticated");
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
  };
}

// ── Player Report ──

export type ReportType = 'suspicious' | 'cheater' | 'approve';

export interface ReportOptions {
  type: ReportType;
  reason?: string;
}

export async function reportPlayer(playerId: string | number, opts: ReportOptions): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required — please log in");
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

type RawPost = {
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

type RawComment = {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  parent_id: number | null;
  content: string;
  created_at: string;
};

function mapPost(raw: RawPost): Post {
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

function mapComment(raw: RawComment): Comment {
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
  }>>(`/builds${query.toString() ? `?${query.toString()}` : ''}`);

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
  }>(`/builds`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ champion_id: championId, name, items, actives, talents, notes, visibility }),
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
  }>(`/builds/${buildId}`);

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
  tier?: number | null;
  source?: string | null;
  party_number?: number | null;
  kda: number;
  damage_per_minute: number;
  healing_per_minute: number;
  healing_self_per_minute: number;
  time_in_match: number;
  afk_rate: number;
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
}

export async function fetchMatchHourlyStats(): Promise<MatchHourlyStats> {
  return fetchJson<MatchHourlyStats>('/matches/hourly-stats');
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

