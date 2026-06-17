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

// Per-class champion metric data for detail pages
// Each metric has per-class stats with champion breakdowns
interface ClassMetric {
  className: string;
  avg: number;
  min: number;
  max: number;
  champions: Array<{ name: string; value: number; matches: number; min: number; max: number; mean: number; mode: number }>;
}

export const MOCK_METRIC_BY_CLASS: Record<string, Record<string, ClassMetric>> = {
  dpm: {
    Frontline: {
      className: "Frontline", avg: 420, min: 180, max: 680,
      champions: [
        { name: "Raum", value: 680, matches: 8_420, min: 633, max: 735, mean: 625, mode: 578 },
        { name: "Terminus", value: 610, matches: 6_310, min: 542, max: 657, mean: 561, mode: 518 },
        { name: "Ash", value: 540, matches: 7_890, min: 395, max: 576, mean: 496, mode: 459 },
        { name: "Khan", value: 490, matches: 9_120, min: 487, max: 573, mean: 450, mode: 416 },
        { name: "Ruckus", value: 460, matches: 5_640, min: 342, max: 546, mean: 423, mode: 391 },
      ],
    },
    Damage: {
      className: "Damage", avg: 890, min: 520, max: 1_420,
      champions: [
        { name: "Drogoz", value: 1_420, matches: 11_240, min: 1_192, max: 1_435, mean: 1_306, mode: 1_207 },
        { name: "Lian", value: 1_280, matches: 14_560, min: 1_069, max: 1_501, mean: 1_177, mode: 1_088 },
        { name: "Cassie", value: 1_150, matches: 12_890, min: 916, max: 1_270, mean: 1_058, mode: 977 },
        { name: "Viktor", value: 1_040, matches: 16_320, min: 808, max: 1_240, mean: 956, mode: 884 },
        { name: "Tyra", value: 980, matches: 10_470, min: 710, max: 1_270, mean: 901, mode: 833 },
      ],
    },
    Flank: {
      className: "Flank", avg: 720, min: 340, max: 1_180,
      champions: [
        { name: "Androxus", value: 1_180, matches: 13_450, min: 1_109, max: 1_202, mean: 1_085, mode: 1_003 },
        { name: "Evie", value: 1_020, matches: 8_920, min: 980, max: 1_225, mean: 938, mode: 867 },
        { name: "Maeve", value: 940, matches: 11_340, min: 825, max: 1_027, mean: 864, mode: 799 },
        { name: "Zhin", value: 810, matches: 9_780, min: 702, max: 1_015, mean: 745, mode: 688 },
        { name: "Koga", value: 760, matches: 7_560, min: 615, max: 762, mean: 699, mode: 646 },
      ],
    },
    Support: {
      className: "Support", avg: 280, min: 85, max: 520,
      champions: [
        { name: "Grohk", value: 520, matches: 6_230, min: 408, max: 574, mean: 478, mode: 442 },
        { name: "Furia", value: 480, matches: 8_910, min: 380, max: 550, mean: 441, mode: 408 },
        { name: "Grover", value: 340, matches: 7_450, min: 274, max: 350, mean: 312, mode: 289 },
        { name: "Corvus", value: 290, matches: 5_120, min: 244, max: 324, mean: 266, mode: 246 },
        { name: "Jenos", value: 210, matches: 9_340, min: 157, max: 259, mean: 193, mode: 178 },
      ],
    },
  },
  hpm: {
    Frontline: {
      className: "Frontline", avg: 320, min: 0, max: 780,
      champions: [
        { name: "Terminus", value: 780, matches: 6_310, min: 580, max: 869, mean: 717, mode: 663 },
        { name: "Inara", value: 540, matches: 7_120, min: 379, max: 662, mean: 496, mode: 459 },
        { name: "Nyx", value: 420, matches: 4_890, min: 340, max: 493, mean: 386, mode: 357 },
        { name: "Fernando", value: 280, matches: 11_240, min: 264, max: 301, mean: 257, mode: 238 },
        { name: "Ash", value: 120, matches: 7_890, min: 89, max: 150, mean: 110, mode: 102 },
      ],
    },
    Damage: {
      className: "Damage", avg: 45, min: 0, max: 180,
      champions: [
        { name: "Tyra", value: 180, matches: 10_470, min: 156, max: 206, mean: 165, mode: 153 },
        { name: "Vivian", value: 120, matches: 6_890, min: 111, max: 146, mean: 110, mode: 102 },
        { name: "Viktor", value: 85, matches: 16_320, min: 47, max: 133, mean: 78, mode: 72 },
        { name: "Lian", value: 20, matches: 14_560, min: 0, max: 39, mean: 18, mode: 17 },
        { name: "Drogoz", value: 0, matches: 11_240, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
      ],
    },
    Flank: {
      className: "Flank", avg: 60, min: 0, max: 240,
      champions: [
        { name: "Buck", value: 240, matches: 5_340, min: 199, max: 250, mean: 220, mode: 204 },
        { name: "Skye", value: 160, matches: 6_120, min: 114, max: 192, mean: 147, mode: 136 },
        { name: "Maeve", value: 45, matches: 11_340, min: 20, max: 54, mean: 41, mode: 38 },
        { name: "Androxus", value: 20, matches: 13_450, min: 0, max: 52, mean: 18, mode: 17 },
        { name: "Evie", value: 0, matches: 8_920, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
      ],
    },
    Support: {
      className: "Support", avg: 3_240, min: 980, max: 5_800,
      champions: [
        { name: "Seris", value: 5_800, matches: 15_240, min: 5_224, max: 7_127, mean: 5_336, mode: 4_930 },
        { name: "Io", value: 4_620, matches: 12_890, min: 3_898, max: 5_099, mean: 4_250, mode: 3_927 },
        { name: "Grover", value: 4_180, matches: 7_450, min: 3_448, max: 4_628, mean: 3_845, mode: 3_553 },
        { name: "Ying", value: 3_540, matches: 11_340, min: 3_407, max: 4_200, mean: 3_256, mode: 3_009 },
        { name: "Mal Damba", value: 2_980, matches: 8_120, min: 2_363, max: 3_335, mean: 2_741, mode: 2_533 },
      ],
    },
  },
  gpm: {
    Frontline: {
      className: "Frontline", avg: 1_620, min: 980, max: 2_340,
      champions: [
        { name: "Khan", value: 2_340, matches: 9_120, min: 2_262, max: 2_351, mean: 2_152, mode: 1_989 },
        { name: "Fernando", value: 2_180, matches: 11_240, min: 2_032, max: 2_405, mean: 2_005, mode: 1_853 },
        { name: "Barik", value: 1_920, matches: 8_450, min: 1_584, max: 1_930, mean: 1_766, mode: 1_632 },
        { name: "Inara", value: 1_680, matches: 7_120, min: 1_591, max: 1_820, mean: 1_545, mode: 1_428 },
        { name: "Raum", value: 1_420, matches: 8_420, min: 1_271, max: 1_685, mean: 1_306, mode: 1_207 },
      ],
    },
    Damage: {
      className: "Damage", avg: 2_140, min: 1_420, max: 3_600,
      champions: [
        { name: "Lian", value: 3_600, matches: 14_560, min: 3_173, max: 3_749, mean: 3_312, mode: 3_060 },
        { name: "Cassie", value: 3_120, matches: 12_890, min: 2_277, max: 3_159, mean: 2_870, mode: 2_652 },
        { name: "Viktor", value: 2_840, matches: 16_320, min: 2_632, max: 2_860, mean: 2_612, mode: 2_414 },
        { name: "Kinessa", value: 2_480, matches: 9_340, min: 2_248, max: 2_974, mean: 2_281, mode: 2_108 },
        { name: "Drogoz", value: 2_280, matches: 11_240, min: 2_142, max: 2_619, mean: 2_097, mode: 1_938 },
      ],
    },
    Flank: {
      className: "Flank", avg: 1_980, min: 1_120, max: 3_240,
      champions: [
        { name: "Androxus", value: 3_240, matches: 13_450, min: 2_989, max: 3_700, mean: 2_980, mode: 2_754 },
        { name: "Maeve", value: 2_860, matches: 11_340, min: 2_631, max: 3_457, mean: 2_631, mode: 2_431 },
        { name: "Evie", value: 2_420, matches: 8_920, min: 2_152, max: 2_823, mean: 2_226, mode: 2_057 },
        { name: "Zhin", value: 2_180, matches: 9_780, min: 1_802, max: 2_577, mean: 2_005, mode: 1_853 },
        { name: "Koga", value: 1_840, matches: 7_560, min: 1_791, max: 1_842, mean: 1_692, mode: 1_564 },
      ],
    },
    Support: {
      className: "Support", avg: 1_480, min: 820, max: 2_240,
      champions: [
        { name: "Furia", value: 2_240, matches: 8_910, min: 1_804, max: 2_598, mean: 2_060, mode: 1_904 },
        { name: "Grohk", value: 1_980, matches: 6_230, min: 1_844, max: 2_064, mean: 1_821, mode: 1_683 },
        { name: "Jenos", value: 1_620, matches: 9_340, min: 1_549, max: 1_804, mean: 1_490, mode: 1_377 },
        { name: "Seris", value: 1_340, matches: 15_240, min: 1_226, max: 1_467, mean: 1_232, mode: 1_139 },
        { name: "Io", value: 1_120, matches: 12_890, min: 1_070, max: 1_179, mean: 1_030, mode: 952 },
      ],
    },
  },
  mpm: {
    Frontline: {
      className: "Frontline", avg: 2_180, min: 420, max: 4_200,
      champions: [
        { name: "Inara", value: 4_200, matches: 7_120, min: 3_607, max: 4_340, mean: 3_864, mode: 3_570 },
        { name: "Terminus", value: 3_640, matches: 6_310, min: 2_738, max: 4_509, mean: 3_348, mode: 3_094 },
        { name: "Nyx", value: 2_840, matches: 4_890, min: 2_718, max: 2_943, mean: 2_612, mode: 2_414 },
        { name: "Barik", value: 1_980, matches: 8_450, min: 1_806, max: 2_224, mean: 1_821, mode: 1_683 },
        { name: "Fernando", value: 1_420, matches: 11_240, min: 1_404, max: 1_423, mean: 1_306, mode: 1_207 },
      ],
    },
    Damage: {
      className: "Damage", avg: 18, min: 0, max: 85,
      champions: [
        { name: "Vivian", value: 85, matches: 6_890, min: 76, max: 111, mean: 78, mode: 72 },
        { name: "Viktor", value: 42, matches: 16_320, min: 4, max: 90, mean: 38, mode: 35 },
        { name: "Tyra", value: 15, matches: 10_470, min: 0, max: 61, mean: 13, mode: 12 },
        { name: "Lian", value: 0, matches: 14_560, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
        { name: "Cassie", value: 0, matches: 12_890, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
      ],
    },
    Flank: {
      className: "Flank", avg: 25, min: 0, max: 180,
      champions: [
        { name: "Vora", value: 180, matches: 6_120, min: 129, max: 226, mean: 165, mode: 153 },
        { name: "Zhin", value: 95, matches: 9_780, min: 49, max: 100, mean: 87, mode: 80 },
        { name: "Vatu", value: 35, matches: 5_340, min: 25, max: 71, mean: 32, mode: 29 },
        { name: "Maeve", value: 0, matches: 11_340, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
        { name: "Androxus", value: 0, matches: 13_450, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
      ],
    },
    Support: {
      className: "Support", avg: 85, min: 0, max: 420,
      champions: [
        { name: "Io", value: 420, matches: 12_890, min: 328, max: 521, mean: 386, mode: 357 },
        { name: "Grover", value: 280, matches: 7_450, min: 202, max: 302, mean: 257, mode: 238 },
        { name: "Furia", value: 120, matches: 8_910, min: 96, max: 144, mean: 110, mode: 102 },
        { name: "Seris", value: 45, matches: 15_240, min: 0, max: 92, mean: 41, mode: 38 },
        { name: "Jenos", value: 0, matches: 9_340, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
      ],
    },
  },
  kda: {
    Frontline: {
      className: "Frontline", avg: 1.8, min: 0.9, max: 2.8,
      champions: [
        { name: "Khan", value: 2.8, matches: 9_120, min: 1.1, max: 5.0, mean: 2.7, mode: 2.4 },
        { name: "Fernando", value: 2.4, matches: 11_240, min: 1.0, max: 4.3, mean: 2.3, mode: 2.0 },
        { name: "Ash", value: 2.1, matches: 7_890, min: 0.8, max: 3.8, mean: 2.0, mode: 1.8 },
        { name: "Barik", value: 1.9, matches: 8_450, min: 0.8, max: 3.4, mean: 1.8, mode: 1.6 },
        { name: "Inara", value: 1.4, matches: 7_120, min: 0.6, max: 2.5, mean: 1.3, mode: 1.2 },
      ],
    },
    Damage: {
      className: "Damage", avg: 2.4, min: 1.2, max: 3.8,
      champions: [
        { name: "Lian", value: 3.8, matches: 14_560, min: 1.5, max: 6.8, mean: 3.6, mode: 3.2 },
        { name: "Cassie", value: 3.4, matches: 12_890, min: 1.4, max: 6.1, mean: 3.2, mode: 2.9 },
        { name: "Kinessa", value: 3.1, matches: 9_340, min: 1.2, max: 5.6, mean: 2.9, mode: 2.6 },
        { name: "Viktor", value: 2.6, matches: 16_320, min: 1.0, max: 4.7, mean: 2.5, mode: 2.2 },
        { name: "Drogoz", value: 2.2, matches: 11_240, min: 0.9, max: 4.0, mean: 2.1, mode: 1.9 },
      ],
    },
    Flank: {
      className: "Flank", avg: 2.6, min: 1.1, max: 4.2,
      champions: [
        { name: "Androxus", value: 4.2, matches: 13_450, min: 1.7, max: 7.6, mean: 4.0, mode: 3.6 },
        { name: "Evie", value: 3.8, matches: 8_920, min: 1.5, max: 6.8, mean: 3.6, mode: 3.2 },
        { name: "Maeve", value: 3.4, matches: 11_340, min: 1.4, max: 6.1, mean: 3.2, mode: 2.9 },
        { name: "Vatu", value: 2.8, matches: 5_340, min: 1.1, max: 5.0, mean: 2.7, mode: 2.4 },
        { name: "Zhin", value: 2.1, matches: 9_780, min: 0.8, max: 3.8, mean: 2.0, mode: 1.8 },
      ],
    },
    Support: {
      className: "Support", avg: 2.1, min: 0.8, max: 3.6,
      champions: [
        { name: "Furia", value: 3.6, matches: 8_910, min: 1.4, max: 6.5, mean: 3.4, mode: 3.1 },
        { name: "Grohk", value: 2.9, matches: 6_230, min: 1.2, max: 5.2, mean: 2.8, mode: 2.5 },
        { name: "Jenos", value: 2.4, matches: 9_340, min: 1.0, max: 4.3, mean: 2.3, mode: 2.0 },
        { name: "Ying", value: 2.0, matches: 11_340, min: 0.8, max: 3.6, mean: 1.9, mode: 1.7 },
        { name: "Seris", value: 1.5, matches: 15_240, min: 0.6, max: 2.7, mean: 1.4, mode: 1.3 },
      ],
    },
  },
};

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

export const MOCK_ITEM_STATS = [
  // Defense
  { name: "Blast Shields", pickRate: 44.6, winRate: 50.3, category: "Defense", icon: "/images/items/Blast_Shields_Icon.avif" },
  { name: "Guardian", pickRate: 14.2, winRate: 47.9, category: "Defense", icon: "/images/items/Guardian_Icon.avif" },
  { name: "Haven", pickRate: 71.8, winRate: 52.9, category: "Defense", icon: "/images/items/Haven_Icon.avif" },
  { name: "Resilience", pickRate: 52.3, winRate: 50.7, category: "Defense", icon: "/images/items/Resilience_Icon.avif" },
  { name: "Sentinel", pickRate: 9.8, winRate: 46.4, category: "Defense", icon: "/images/items/Sentinel_Icon.avif" },
  // Utility
  { name: "Chronos", pickRate: 39.8, winRate: 51.9, category: "Utility", icon: "/images/items/Chronos_Icon.avif" },
  { name: "Hoard", pickRate: 15.3, winRate: 47.8, category: "Utility", icon: "/images/items/Hoard_Icon.avif" },
  { name: "Master Riding", pickRate: 12.4, winRate: 47.2, category: "Utility", icon: "/images/items/Master_Riding_Icon.avif" },
  { name: "Morale Boost", pickRate: 45.2, winRate: 52.6, category: "Utility", icon: "/images/items/Morale_Boost_Icon.avif" },
  { name: "Nimble", pickRate: 58.9, winRate: 51.8, category: "Utility", icon: "/images/items/Nimble_Icon.avif" },
  // Healing
  { name: "Bloodbath", pickRate: 21.5, winRate: 51.1, category: "Healing", icon: "/images/items/Bloodbath_Icon.avif" },
  { name: "Life Rip", pickRate: 42.7, winRate: 50.8, category: "Healing", icon: "/images/items/Life_Rip_Icon.avif" },
  { name: "Meditation", pickRate: 27.3, winRate: 50.2, category: "Healing", icon: "/images/items/Meditation_Icon.avif" },
  { name: "Rejuvenate", pickRate: 38.4, winRate: 51.5, category: "Healing", icon: "/images/items/Rejuvenate_Icon.avif" },
  { name: "Veteran", pickRate: 8.2, winRate: 46.1, category: "Healing", icon: "/images/items/Veteran_Icon.avif" },
  // Offense
  { name: "Bulldozer", pickRate: 23.5, winRate: 48.3, category: "Offense", icon: "/images/items/Bulldozer_Icon.avif" },
  { name: "Deft Hands", pickRate: 31.7, winRate: 50.1, category: "Offense", icon: "/images/items/Deft_Hands_Icon.avif" },
  { name: "Lethality", pickRate: 18.4, winRate: 49.6, category: "Offense", icon: "/images/items/Lethality_Icon.avif" },
  { name: "Trigger Scent", pickRate: 11.6, winRate: 48.5, category: "Offense", icon: "/images/items/Trigger_Scent_Icon.avif" },
  { name: "Wrecker", pickRate: 68.1, winRate: 49.8, category: "Offense", icon: "/images/items/Wrecker_Icon.avif" },
];

export const MOCK_MAP_STATS = [
  { name: "Jaguar Falls", matches: 18_420, avgDuration: "12:34" },
  { name: "Serpent Beach", matches: 16_890, avgDuration: "11:52" },
  { name: "Fish Market", matches: 15_340, avgDuration: "13:10" },
  { name: "Frog Isle", matches: 14_720, avgDuration: "10:45" },
  { name: "Stone Keep", matches: 13_580, avgDuration: "14:22" },
  { name: "Brightmarsh", matches: 12_910, avgDuration: "11:18" },
  { name: "Ascension Peak", matches: 11_460, avgDuration: "12:08" },
  { name: "Ice Mines", matches: 10_840, avgDuration: "13:45" },
  { name: "Splitstone Quarry", matches: 9_670, avgDuration: "11:30" },
  { name: "Warder's Gate", matches: 8_920, avgDuration: "12:55" },
];

export const TIER_NAMES: Record<number, string> = {
  1: 'Bronze V', 2: 'Bronze IV', 3: 'Bronze III', 4: 'Bronze II', 5: 'Bronze I',
  6: 'Silver V', 7: 'Silver IV', 8: 'Silver III', 9: 'Silver II', 10: 'Silver I',
  11: 'Gold V', 12: 'Gold IV', 13: 'Gold III', 14: 'Gold II', 15: 'Gold I',
  16: 'Platinum V', 17: 'Platinum IV', 18: 'Platinum III', 19: 'Platinum II', 20: 'Platinum I',
  21: 'Diamond V', 22: 'Diamond IV', 23: 'Diamond III', 24: 'Diamond II', 25: 'Diamond I',
  26: 'Master',
  27: 'Grandmaster',
};
