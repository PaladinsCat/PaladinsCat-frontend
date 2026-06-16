// Auto-generated TypeScript types from Fastify backend API spec
// Run: npm run generate-types

export type Champion = {
  id: number;
  name: string;
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
  rating?: number | null;
  ratingDeviation?: number | null;
  volatility?: number | null;
  totalMatches?: number | null;
  totalPlays?: number | null;
  wins?: number | null;
  class?: string | null;
  cost?: number | null;
  description?: string | null;
  roles?: string[] | null;
  region?: string[] | null;
  platform?: string | null;
  imagePath?: string | null;
};

export type ChampionStats = {
  wins?: number | null;
  totalPlays?: number | null;
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
  totalMatches?: number | null;
};

export type ChampionRating = {
  rating?: number | null;
  deviation?: number | null;
  volatility?: number | null;
};

export type ChampionDetail = {
  id: number;
  name: string;
  class?: string | null;
  cost?: number | null;
  description?: string | null;
  totalPlays?: number | null;
  totalMatches?: number | null;
  wins?: number | null;
  stats?: ChampionStats | null;
  ratings?: ChampionRating | null;
  tierStats?: Array<{ tier: string; winRate: number; pickRate: number; totalPlays: number }> | null;
  patchTrends?: Array<{ trendWeek: string; weeklyWinRate: number; weeklyPlays: number }> | null;
};

export type Player = {
  id: string;
  name: string;
  platform?: string | null;
  region?: string | null;
  kbm_tier?: string | null;
  kbm_points?: number | null;
};

export type PlayerProfile = {
  id: string;
  name: string;
  platform?: string | null;
  region?: string | null;
  kbmTier?: string | null;
  kbmPoints?: number | null;
  totalMatches?: number | null;
  totalWins?: number | null;
  winRate?: number | null;
  totalPlays?: number | null;
  topChampions?: Array<{ championName: string; championId: number; wins: number; totalPlays: number; winRate: number }> | null;
  source?: string | null;
};

export type PlayerSearchResult = {
  id: string;
  name: string;
  platform?: string | null;
  region?: string | null;
  kbmTier?: string | null;
};

export type MatchSummary = {
  matchId: string;
  queueId?: number | null;
  mapGame?: string | null;
  region?: string | null;
  platform?: string | null;
  isRanked?: boolean | null;
  durationSeconds?: number | null;
  entryDatetime?: string | null;
  playerCount?: number | null;
};

export type MatchPlayer = {
  playerId?: string | null;
  championId?: number | null;
  championName?: string | null;
  winStatus?: string | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  damageDone?: number | null;
  healing?: number | null;
  damagePerMinute?: number | null;
  healsPerMinute?: number | null;
  leagueTier?: string | null;
  deckHash?: string | null;
  itemBuildHash?: string | null;
  talents?: unknown | null;
  items?: unknown | null;
  actives?: unknown | null;
};

export type MatchDetail = {
  match: MatchSummary;
  players: MatchPlayer[];
  playerCount: number;
};

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  lastLogin: string | null;
};

export type SessionResponse = {
  user: UserResponse;
  token: string;
  expiresAt: string;
};

export type PostResponse = {
  id: number;
  userId: number;
  username: string;
  title: string;
  content: string;
  buildId: number | null;
  likes: number;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CommentResponse = {
  id: number;
  userId: number;
  username: string;
  parentId: number | null;
  content: string;
  createdAt: string;
};

export type BuildResponse = {
  id: number;
  userId: number;
  username: string;
  championId: number;
  championName: string | null;
  name: string;
  items: number[];
  actives: number[];
  talents: number[];
  notes: string | null;
  visibility: string;
  likes: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};
