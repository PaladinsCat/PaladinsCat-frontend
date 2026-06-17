// Real champion data sourced from C:\Users\nabi\PaladinsCat\documents\champions\
// Types match api-client interfaces: Champion, StatsChampion, RankedPlayer

// Real champions by role — 59 total
const REAL_CHAMPIONS = [
  // Frontline
  { name: 'Ash', role: 'Frontline' },
  { name: 'Atlas', role: 'Frontline' },
  { name: 'Azaan', role: 'Frontline' },
  { name: 'Barik', role: 'Frontline' },
  { name: 'Fernando', role: 'Frontline' },
  { name: 'Inara', role: 'Frontline' },
  { name: 'Khan', role: 'Frontline' },
  { name: 'Makoa', role: 'Frontline' },
  { name: 'Nyx', role: 'Frontline' },
  { name: 'Raum', role: 'Frontline' },
  { name: 'Ruckus', role: 'Frontline' },
  { name: 'Terminus', role: 'Frontline' },
  { name: 'Torvald', role: 'Frontline' },
  { name: 'Yagorath', role: 'Frontline' },
  // Damage
  { name: 'Betty La Bomba', role: 'Damage' },
  { name: 'Bomb King', role: 'Damage' },
  { name: 'Cassie', role: 'Damage' },
  { name: 'Dredge', role: 'Damage' },
  { name: 'Drogoz', role: 'Damage' },
  { name: 'Imani', role: 'Damage' },
  { name: 'Kinessa', role: 'Damage' },
  { name: 'Lian', role: 'Damage' },
  { name: 'Octavia', role: 'Damage' },
  { name: 'Omen', role: 'Damage' },
  { name: 'Saati', role: 'Damage' },
  { name: 'Sha Lin', role: 'Damage' },
  { name: 'Strix', role: 'Damage' },
  { name: 'Tiberius', role: 'Damage' },
  { name: 'Tyra', role: 'Damage' },
  { name: 'Viktor', role: 'Damage' },
  { name: 'Vivian', role: 'Damage' },
  { name: 'Willo', role: 'Damage' },
  // Flank
  { name: 'Androxus', role: 'Flank' },
  { name: 'Buck', role: 'Flank' },
  { name: 'Caspian', role: 'Flank' },
  { name: 'Evie', role: 'Flank' },
  { name: 'Kasumi', role: 'Flank' },
  { name: 'Koga', role: 'Flank' },
  { name: 'Lex', role: 'Flank' },
  { name: 'Maeve', role: 'Flank' },
  { name: 'Skye', role: 'Flank' },
  { name: 'Talus', role: 'Flank' },
  { name: 'Vatu', role: 'Flank' },
  { name: 'VII', role: 'Flank' },
  { name: 'Vora', role: 'Flank' },
  { name: 'Zhin', role: 'Flank' },
  // Support
  { name: 'Corvus', role: 'Support' },
  { name: 'Furia', role: 'Support' },
  { name: 'Grohk', role: 'Support' },
  { name: 'Grover', role: 'Support' },
  { name: 'Io', role: 'Support' },
  { name: 'Jenos', role: 'Support' },
  { name: 'Lillith', role: 'Support' },
  { name: 'Mal Damba', role: 'Support' },
  { name: 'Moji', role: 'Support' },
  { name: 'Pip', role: 'Support' },
  { name: 'Rei', role: 'Support' },
  { name: 'Seris', role: 'Support' },
  { name: 'Ying', role: 'Support' },
];

// Generate realistic mock stats for each champion
function generateStats(): Array<{ id: number; name: string; roles: string[]; winRate: number; banRate: number }> {
  const seed = ['Ash','Atlas','Azaan','Barik','Fernando','Inara','Khan','Makoa','Nyx','Raum','Ruckus','Terminus','Torvald','Yagorath','Betty La Bomba','Bomb King','Cassie','Dredge','Drogoz','Imani','Kinessa','Lian','Octavia','Omen','Saati','Sha Lin','Strix','Tiberius','Tyra','Viktor','Vivian','Willo','Androxus','Buck','Caspian','Evie','Kasumi','Koga','Lex','Maeve','Skye','Talus','Vatu','VII','Vora','Zhin','Corvus','Furia','Grohk','Grover','Io','Jenos','Lillith','Mal Damba','Moji','Pip','Rei','Seris','Ying'];
  // Fixed PRNG for reproducible results
  function rand(base: number, spread: number, idx: number) {
    return base + ((idx * 7 + 13) % spread) / spread * 10 - 5;
  }
  return REAL_CHAMPIONS.map((c, i) => ({
    id: i + 1,
    name: c.name,
    roles: [c.role],
    winRate: Math.round((rand(50, 6, i) * 10) * 10) / 10,
    banRate: Math.round((rand(10, 15, i) * 10) * 10) / 10,
  }));
}

const CHAMPIONS_WITH_STATS = generateStats();

export const MOCK_STATS_CHAMPIONS = CHAMPIONS_WITH_STATS.map(c => ({
  championId: c.id,
  championName: c.name,
  winRate: c.winRate,
  totalPlays: 150000 + (c.id * 3700),
  banRate: c.banRate,
}));

export const MOCK_CHAMPIONS = CHAMPIONS_WITH_STATS.map(c => ({
  id: c.id,
  name: c.name,
  roles: c.roles,
  winRate: c.winRate,
  banRate: c.banRate,
}));

/**
 * Static champion list — always 59 champions, no DB-dependent stats.
 * Use this as the guaranteed base for the champions page.
 * Stats (winRate, pickRate, banRate, etc.) are null and shown as "—" until
 * the backend provides real data.
 */
export const STATIC_CHAMPIONS = REAL_CHAMPIONS.map((c, i) => ({
  id: i + 1,
  name: c.name,
  roles: [c.role],
}));

// Real Paladins champion names for ranked leaderboard
export const MOCK_RANKED_PLAYERS = [
  { rank: 1, player_id: 1001, name: 'ShadowStrike', tier: 26, points: 1850, trend: 3 },
  { rank: 2, player_id: 1002, name: 'IronWill', tier: 26, points: 1920, trend: -1 },
  { rank: 3, player_id: 1003, name: 'StormBreaker', tier: 26, points: 1880, trend: 2 },
  { rank: 4, player_id: 1004, name: 'DarkPulse', tier: 26, points: 1950, trend: -2 },
  { rank: 5, player_id: 1005, name: 'BlazeMaster', tier: 26, points: 1680, trend: 1 },
  { rank: 6, player_id: 1006, name: 'CrystalVeil', tier: 26, points: 1710, trend: 4 },
  { rank: 7, player_id: 1007, name: 'SilverLeaf', tier: 26, points: 1650, trend: -3 },
  { rank: 8, player_id: 1008, name: 'NightHawk', tier: 26, points: 1520, trend: 5 },
  { rank: 9, player_id: 1009, name: 'FrostByte', tier: 26, points: 1480, trend: -1 },
  { rank: 10, player_id: 1010, name: 'ThunderBolt', tier: 26, points: 1350, trend: 0 },
  { rank: 11, player_id: 1011, name: 'VoidWalker', tier: 26, points: 1580, trend: 2 },
  { rank: 12, player_id: 1012, name: 'LunaRose', tier: 26, points: 1420, trend: -2 },
  { rank: 13, player_id: 1013, name: 'EchoChaser', tier: 26, points: 1390, trend: 1 },
  { rank: 14, player_id: 1014, name: 'RiftWalker', tier: 26, points: 1310, trend: 3 },
  { rank: 15, player_id: 1015, name: 'MysticArc', tier: 26, points: 1280, trend: -4 },
  { rank: 16, player_id: 1016, name: 'ZenithBlade', tier: 26, points: 1250, trend: 0 },
  { rank: 17, player_id: 1017, name: 'SolarFlare', tier: 26, points: 1220, trend: 2 },
  { rank: 18, player_id: 1018, name: 'DreadNova', tier: 26, points: 1190, trend: -1 },
  { rank: 19, player_id: 1019, name: 'AetherPulse', tier: 26, points: 1150, trend: -2 },
  { rank: 20, player_id: 1020, name: 'NovaStrike', tier: 26, points: 1120, trend: 1 },
];

// Stat leaderboards — per-class top players
export const MOCK_CLASS_LEADERBOARDS: Record<string, Array<{ name: string; champion: string; winRate: number; matches: number }>> = {
  Frontline: [
    { name: 'IronWill', champion: 'Fernando', winRate: 61.2, matches: 340 },
    { name: 'StormBreaker', champion: 'Khan', winRate: 58.7, matches: 285 },
    { name: 'VoidWalker', champion: 'Barik', winRate: 57.3, matches: 310 },
    { name: 'ThunderBolt', champion: 'Inara', winRate: 56.1, matches: 220 },
    { name: 'DreadNova', champion: 'Raum', winRate: 55.8, matches: 195 },
  ],
  Damage: [
    { name: 'DarkPulse', champion: 'Lian', winRate: 63.4, matches: 410 },
    { name: 'ShadowStrike', champion: 'Cassie', winRate: 60.1, matches: 375 },
    { name: 'SolarFlare', champion: 'Viktor', winRate: 58.9, matches: 350 },
    { name: 'CrystalVeil', champion: 'Drogoz', winRate: 57.5, matches: 290 },
    { name: 'BlazeMaster', champion: 'Tyra', winRate: 56.2, matches: 260 },
  ],
  Flank: [
    { name: 'NightHawk', champion: 'Androxus', winRate: 64.8, matches: 420 },
    { name: 'MysticArc', champion: 'Evie', winRate: 62.3, matches: 380 },
    { name: 'FrostByte', champion: 'Maeve', winRate: 59.1, matches: 315 },
    { name: 'SilverLeaf', champion: 'Zhin', winRate: 57.6, matches: 275 },
    { name: 'ZenithBlade', champion: 'Koga', winRate: 55.4, matches: 240 },
  ],
  Support: [
    { name: 'LunaRose', champion: 'Seris', winRate: 60.5, matches: 360 },
    { name: 'EchoChaser', champion: 'Io', winRate: 58.2, matches: 320 },
    { name: 'RiftWalker', champion: 'Grover', winRate: 57.8, matches: 295 },
    { name: 'AetherPulse', champion: 'Jenos', winRate: 56.4, matches: 250 },
    { name: 'NovaStrike', champion: 'Furia', winRate: 54.9, matches: 210 },
  ],
};

// Performance stat leaderboards — GPM, HPM, DPM
export const MOCK_STAT_LEADERBOARDS: Record<string, Array<{ name: string; champion: string; value: number }>> = {
  GPM: [
    { name: 'DarkPulse', champion: 'Lian', value: 2847 },
    { name: 'NightHawk', champion: 'Androxus', value: 2691 },
    { name: 'ShadowStrike', champion: 'Cassie', value: 2580 },
    { name: 'MysticArc', champion: 'Evie', value: 2475 },
    { name: 'SolarFlare', champion: 'Viktor', value: 2340 },
  ],
  HPM: [
    { name: 'LunaRose', champion: 'Seris', value: 4120 },
    { name: 'EchoChaser', champion: 'Io', value: 3890 },
    { name: 'RiftWalker', champion: 'Grover', value: 3650 },
    { name: 'IronWill', champion: 'Fernando', value: 1980 },
    { name: 'AetherPulse', champion: 'Jenos', value: 3510 },
  ],
  DPM: [
    { name: 'DarkPulse', champion: 'Lian', value: 985 },
    { name: 'NightHawk', champion: 'Androxus', value: 920 },
    { name: 'ShadowStrike', champion: 'Cassie', value: 875 },
    { name: 'CrystalVeil', champion: 'Drogoz', value: 840 },
    { name: 'BlazeMaster', champion: 'Tyra', value: 810 },
  ],
  Tanker: [
    { name: 'IronWill', champion: 'Fernando', value: 3240 },
    { name: 'StormBreaker', champion: 'Khan', value: 2980 },
    { name: 'VoidWalker', champion: 'Barik', value: 2750 },
    { name: 'ThunderBolt', champion: 'Inara', value: 2610 },
    { name: 'DreadNova', champion: 'Raum', value: 2480 },
  ],
};

// Confirmed cheaters — these are verified bans
export const MOCK_CONFIRMED_CHEATERS = [
  { name: 'AimBot_King', id: 9001, reason: 'Abnormal accuracy (98.7%)', banned: '2026-06-10' },
  { name: 'WallHackPro', id: 9002, reason: 'Tracking through walls', banned: '2026-06-12' },
  { name: 'PerfectAimTTV', id: 9004, reason: 'Headshot rate 3x average', banned: '2026-06-14' },
];

// Suspicious players — under investigation, NOT in confirmed list
export const MOCK_SUSPICIOUS_PLAYERS = [
  { name: 'SpeedDemon99', id: 9003, reason: 'Movement speed anomaly', severity: 'medium' as const, flagged: '2026-06-08' },
  { name: 'Smurf_EzGG', id: 9005, reason: 'Win rate spike (new account)', severity: 'low' as const, flagged: '2026-06-11' },
  { name: 'MacroSpammer', id: 9006, reason: 'Inhuman input patterns', severity: 'medium' as const, flagged: '2026-06-09' },
  { name: 'InstaLockGod', id: 9007, reason: 'Statistical outlier (top 0.1%)', severity: 'low' as const, flagged: '2026-06-13' },
  { name: 'NoRecoil420', id: 9008, reason: 'Zero recoil pattern detected', severity: 'medium' as const, flagged: '2026-06-15' },
];

// Ranked matches per region per hour (mock live stats)
export const MOCK_MATCH_STATS = {
  totalToday: 14_287,
  rankedToday: 8_432,
  regions: [
    { region: "NA", matchesPerHour: 420, peakHour: "8 PM EST", totalToday: 3_810 },
    { region: "EU", matchesPerHour: 510, peakHour: "9 PM CET", totalToday: 4_590 },
    { region: "Asia", matchesPerHour: 280, peakHour: "10 PM JST", totalToday: 2_520 },
    { region: "OCE", matchesPerHour: 95, peakHour: "8 PM AEST", totalToday: 855 },
    { region: "BR", matchesPerHour: 180, peakHour: "9 PM BRT", totalToday: 1_620 },
    { region: "LATAM", matchesPerHour: 115, peakHour: "8 PM CST", totalToday: 1_035 },
  ],
};

// Global item stats
export const MOCK_ITEM_STATS = [
  { name: "Cauterize", pickRate: 92.4, winRate: 51.2, category: "Offense" },
  { name: "Wrecker", pickRate: 68.1, winRate: 49.8, category: "Offense" },
  { name: "Bulldozer", pickRate: 23.5, winRate: 48.3, category: "Offense" },
  { name: "Deft Hands", pickRate: 31.7, winRate: 50.1, category: "Offense" },
  { name: "Morale Boost", pickRate: 45.2, winRate: 52.6, category: "Utility" },
  { name: "Nimble", pickRate: 58.9, winRate: 51.8, category: "Utility" },
  { name: "Master Riding", pickRate: 12.4, winRate: 47.2, category: "Utility" },
  { name: "Illuminate", pickRate: 34.6, winRate: 53.1, category: "Utility" },
  { name: "Resilience", pickRate: 52.3, winRate: 50.7, category: "Utility" },
  { name: "Haven", pickRate: 71.8, winRate: 52.9, category: "Armor" },
  { name: "Blast Shields", pickRate: 44.6, winRate: 50.3, category: "Armor" },
  { name: "Veteran", pickRate: 8.2, winRate: 46.1, category: "Armor" },
  { name: "Rejuvenate", pickRate: 38.4, winRate: 51.5, category: "Healing" },
  { name: "Kill to Heal", pickRate: 29.1, winRate: 49.4, category: "Healing" },
  { name: "Life Rip", pickRate: 42.7, winRate: 50.8, category: "Healing" },
];

// Map stats
export const MOCK_MAP_STATS = [
  { name: "Jaguar Falls", matches: 18_420, avgDuration: "12:34", winRateAttack: 48.2 },
  { name: "Serpent Beach", matches: 16_890, avgDuration: "11:52", winRateAttack: 51.6 },
  { name: "Fish Market", matches: 15_340, avgDuration: "13:10", winRateAttack: 47.8 },
  { name: "Frog Isle", matches: 14_720, avgDuration: "10:45", winRateAttack: 52.1 },
  { name: "Stone Keep", matches: 13_580, avgDuration: "14:22", winRateAttack: 49.5 },
  { name: "Brightmarsh", matches: 12_910, avgDuration: "11:18", winRateAttack: 50.3 },
  { name: "Ascension Peak", matches: 11_460, avgDuration: "12:08", winRateAttack: 48.9 },
  { name: "Ice Mines", matches: 10_840, avgDuration: "13:45", winRateAttack: 51.2 },
  { name: "Splitstone Quarry", matches: 9_670, avgDuration: "11:30", winRateAttack: 49.1 },
  { name: "Warder's Gate", matches: 8_920, avgDuration: "12:55", winRateAttack: 50.7 },
];

// Global performance metrics with distribution
export const MOCK_GLOBAL_METRICS = {
  dpm: { min: 85, max: 1_420, mean: 682, mode: 540 },
  hpm: { min: 0, max: 5_800, mean: 1_240, mode: 980 },
  gpm: { min: 320, max: 3_600, mean: 1_850, mode: 1_620 },
  mpm: { min: 0, max: 4_200, mean: 42, mode: 18 },
  kda: { min: 0.2, max: 8.5, mean: 2.24, mode: 1.8 },
  avgKDA: "2.4 / 4.1 / 6.8",
  totalMatchesTracked: 287_450,
  totalPlayersTracked: 48_320,
  avgMatchDuration: "12:18",
};
export const TIER_NAMES: Record<number, string> = {
  1: 'Bronze V', 2: 'Bronze IV', 3: 'Bronze III', 4: 'Bronze II', 5: 'Bronze I',
  6: 'Silver V', 7: 'Silver IV', 8: 'Silver III', 9: 'Silver II', 10: 'Silver I',
  11: 'Gold V', 12: 'Gold IV', 13: 'Gold III', 14: 'Gold II', 15: 'Gold I',
  16: 'Platinum V', 17: 'Platinum IV', 18: 'Platinum III', 19: 'Platinum II', 20: 'Platinum I',
  21: 'Diamond V', 22: 'Diamond IV', 23: 'Diamond III', 24: 'Diamond II', 25: 'Diamond I',
  26: 'Master',
  27: 'Grandmaster',
};
