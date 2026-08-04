// Shared mock data for UI library comparison prototypes
// Mirrors the shape of RankedPlayer / LeaderboardEntry from the API

export interface MockPlayer {
  rank: number;
  playerName: string;
  platform: string;
  tier: number;
  tierName: string;
  glicko: number;
  winRate: number;
  totalMatches: number;
  totalWins: number;
  mainChampion: string;
  trend: "up" | "down" | "neutral";
}

export const mockLeaderboard: MockPlayer[] = [
  { rank: 1, playerName: "PhantomAce", platform: "Steam", tier: 26, tierName: "Grandmaster", glicko: 1842.5, winRate: 68.4, totalMatches: 2847, totalWins: 1947, mainChampion: "Io", trend: "up" },
  { rank: 2, playerName: "StormCaller", platform: "Battle.net", tier: 26, tierName: "Grandmaster", glicko: 1815.3, winRate: 65.1, totalMatches: 3102, totalWins: 2019, mainChampion: "Vivian", trend: "up" },
  { rank: 3, playerName: "BladeRunner", platform: "Steam", tier: 25, tierName: "Diamond I", glicko: 1789.7, winRate: 62.8, totalMatches: 1953, totalWins: 1227, mainChampion: "Chronos", trend: "down" },
  { rank: 4, playerName: "NovaStrike", platform: "Riot", tier: 25, tierName: "Diamond I", glicko: 1776.2, winRate: 61.3, totalMatches: 2201, totalWins: 1349, mainChampion: "Piper", trend: "up" },
  { rank: 5, playerName: "ShadowHawk", platform: "Steam", tier: 25, tierName: "Diamond I", glicko: 1765.8, winRate: 60.5, totalMatches: 1687, totalWins: 1021, mainChampion: "Ash", trend: "neutral" },
  { rank: 6, playerName: "FrostBite", platform: "Battle.net", tier: 25, tierName: "Diamond I", glicko: 1758.1, winRate: 59.8, totalMatches: 2450, totalWins: 1465, mainChampion: "Bram", trend: "up" },
  { rank: 7, playerName: "ThunderPaw", platform: "Steam", tier: 24, tierName: "Diamond II", glicko: 1742.9, winRate: 58.7, totalMatches: 1890, totalWins: 1109, mainChampion: "Seris", trend: "down" },
  { rank: 8, playerName: "IronClad", platform: "Riot", tier: 24, tierName: "Diamond II", glicko: 1735.4, winRate: 57.9, totalMatches: 2100, totalWins: 1216, mainChampion: "Mio", trend: "up" },
  { rank: 9, playerName: "VoidWalker", platform: "Steam", tier: 24, tierName: "Diamond II", glicko: 1728.6, winRate: 57.2, totalMatches: 1543, totalWins: 885, mainChampion: "Lore", trend: "neutral" },
  { rank: 10, playerName: "CrimsonFox", platform: "Battle.net", tier: 24, tierName: "Diamond II", glicko: 1721.3, winRate: 56.8, totalMatches: 1978, totalWins: 1123, mainChampion: "Fenris", trend: "up" },
];

export interface MockChampionStat {
  name: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  tier: "S" | "A" | "B" | "C" | "D";
}

export const mockChampionStats: MockChampionStat[] = [
  { name: "Io", winRate: 54.2, pickRate: 18.7, banRate: 12.3, tier: "S" },
  { name: "Piper", winRate: 52.8, pickRate: 14.5, banRate: 8.1, tier: "S" },
  { name: "Vivian", winRate: 51.9, pickRate: 16.2, banRate: 15.7, tier: "A" },
  { name: "Chronos", winRate: 51.4, pickRate: 11.3, banRate: 6.4, tier: "A" },
  { name: "Ash", winRate: 50.8, pickRate: 9.8, banRate: 3.2, tier: "A" },
  { name: "Seris", winRate: 50.5, pickRate: 13.1, banRate: 5.9, tier: "B" },
  { name: "Bram", winRate: 50.1, pickRate: 10.4, banRate: 4.1, tier: "B" },
  { name: "Lore", winRate: 49.7, pickRate: 8.6, banRate: 2.7, tier: "B" },
  { name: "Mio", winRate: 49.3, pickRate: 7.9, banRate: 1.8, tier: "C" },
  { name: "Fenris", winRate: 48.9, pickRate: 6.5, banRate: 1.2, tier: "C" },
];

export interface MockMetric {
  label: string;
  value: string;
  change: number;
}

export const mockMetrics: MockMetric[] = [
  { label: "Active Players", value: "12,847", change: 3.2 },
  { label: "Matches Today", value: "48,392", change: -1.8 },
  { label: "Avg Match Duration", value: "24m 12s", change: 0.5 },
  { label: "Server Uptime", value: "99.97%", change: 0.03 },
];

