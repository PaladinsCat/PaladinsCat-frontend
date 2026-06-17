1|// Real champion data sourced from C:\Users\nabi\PaladinsCat\documents\champions\
2|// Types match api-client interfaces: Champion, StatsChampion, RankedPlayer
3|
4|// Real champions by role — 59 total
5|const REAL_CHAMPIONS = [
6|  // Frontline
7|  { name: 'Ash', role: 'Frontline' },
8|  { name: 'Atlas', role: 'Frontline' },
9|  { name: 'Azaan', role: 'Frontline' },
10|  { name: 'Barik', role: 'Frontline' },
11|  { name: 'Fernando', role: 'Frontline' },
12|  { name: 'Inara', role: 'Frontline' },
13|  { name: 'Khan', role: 'Frontline' },
14|  { name: 'Makoa', role: 'Frontline' },
15|  { name: 'Nyx', role: 'Frontline' },
16|  { name: 'Raum', role: 'Frontline' },
17|  { name: 'Ruckus', role: 'Frontline' },
18|  { name: 'Terminus', role: 'Frontline' },
19|  { name: 'Torvald', role: 'Frontline' },
20|  { name: 'Yagorath', role: 'Frontline' },
21|  // Damage
22|  { name: 'Betty La Bomba', role: 'Damage' },
23|  { name: 'Bomb King', role: 'Damage' },
24|  { name: 'Cassie', role: 'Damage' },
25|  { name: 'Dredge', role: 'Damage' },
26|  { name: 'Drogoz', role: 'Damage' },
27|  { name: 'Imani', role: 'Damage' },
28|  { name: 'Kinessa', role: 'Damage' },
29|  { name: 'Lian', role: 'Damage' },
30|  { name: 'Octavia', role: 'Damage' },
31|  { name: 'Omen', role: 'Damage' },
32|  { name: 'Saati', role: 'Damage' },
33|  { name: 'Sha Lin', role: 'Damage' },
34|  { name: 'Strix', role: 'Damage' },
35|  { name: 'Tiberius', role: 'Damage' },
36|  { name: 'Tyra', role: 'Damage' },
37|  { name: 'Viktor', role: 'Damage' },
38|  { name: 'Vivian', role: 'Damage' },
39|  { name: 'Willo', role: 'Damage' },
40|  // Flank
41|  { name: 'Androxus', role: 'Flank' },
42|  { name: 'Buck', role: 'Flank' },
43|  { name: 'Caspian', role: 'Flank' },
44|  { name: 'Evie', role: 'Flank' },
45|  { name: 'Kasumi', role: 'Flank' },
46|  { name: 'Koga', role: 'Flank' },
47|  { name: 'Lex', role: 'Flank' },
48|  { name: 'Maeve', role: 'Flank' },
49|  { name: 'Skye', role: 'Flank' },
50|  { name: 'Talus', role: 'Flank' },
51|  { name: 'Vatu', role: 'Flank' },
52|  { name: 'VII', role: 'Flank' },
53|  { name: 'Vora', role: 'Flank' },
54|  { name: 'Zhin', role: 'Flank' },
55|  // Support
56|  { name: 'Corvus', role: 'Support' },
57|  { name: 'Furia', role: 'Support' },
58|  { name: 'Grohk', role: 'Support' },
59|  { name: 'Grover', role: 'Support' },
60|  { name: 'Io', role: 'Support' },
61|  { name: 'Jenos', role: 'Support' },
62|  { name: 'Lillith', role: 'Support' },
63|  { name: 'Mal Damba', role: 'Support' },
64|  { name: 'Moji', role: 'Support' },
65|  { name: 'Pip', role: 'Support' },
66|  { name: 'Rei', role: 'Support' },
67|  { name: 'Seris', role: 'Support' },
68|  { name: 'Ying', role: 'Support' },
69|];
70|
71|// Generate realistic mock stats for each champion
72|function generateStats(): Array<{ id: number; name: string; roles: string[]; winRate: number; banRate: number }> {
73|  const seed = ['Ash','Atlas','Azaan','Barik','Fernando','Inara','Khan','Makoa','Nyx','Raum','Ruckus','Terminus','Torvald','Yagorath','Betty La Bomba','Bomb King','Cassie','Dredge','Drogoz','Imani','Kinessa','Lian','Octavia','Omen','Saati','Sha Lin','Strix','Tiberius','Tyra','Viktor','Vivian','Willo','Androxus','Buck','Caspian','Evie','Kasumi','Koga','Lex','Maeve','Skye','Talus','Vatu','VII','Vora','Zhin','Corvus','Furia','Grohk','Grover','Io','Jenos','Lillith','Mal Damba','Moji','Pip','Rei','Seris','Ying'];
74|  // Fixed PRNG for reproducible results
75|  function rand(base: number, spread: number, idx: number) {
76|    return base + ((idx * 7 + 13) % spread) / spread * 10 - 5;
77|  }
78|  return REAL_CHAMPIONS.map((c, i) => ({
79|    id: i + 1,
80|    name: c.name,
81|    roles: [c.role],
82|    winRate: Math.round((rand(50, 6, i) * 10) * 10) / 10,
83|    banRate: Math.round((rand(10, 15, i) * 10) * 10) / 10,
84|  }));
85|}
86|
87|const CHAMPIONS_WITH_STATS = generateStats();
88|
89|export const MOCK_STATS_CHAMPIONS = CHAMPIONS_WITH_STATS.map(c => ({
90|  championId: c.id,
91|  championName: c.name,
92|  winRate: c.winRate,
93|  totalPlays: 150000 + (c.id * 3700),
94|  banRate: c.banRate,
95|}));
96|
97|export const MOCK_CHAMPIONS = CHAMPIONS_WITH_STATS.map(c => ({
98|  id: c.id,
99|  name: c.name,
100|  roles: c.roles,
101|  winRate: c.winRate,
102|  banRate: c.banRate,
103|}));
104|
105|/**
106| * Static champion list — always 59 champions, no DB-dependent stats.
107| * Use this as the guaranteed base for the champions page.
108| * Stats (winRate, pickRate, banRate, etc.) are null and shown as "—" until
109| * the backend provides real data.
110| */
111|export const STATIC_CHAMPIONS = REAL_CHAMPIONS.map((c, i) => ({
112|  id: i + 1,
113|  name: c.name,
114|  roles: [c.role],
115|}));
116|
117|// Real Paladins champion names for ranked leaderboard
118|export const MOCK_RANKED_PLAYERS = [
119|  { rank: 1, player_id: 1001, name: 'ShadowStrike', tier: 26, points: 1850, trend: 3 },
120|  { rank: 2, player_id: 1002, name: 'IronWill', tier: 26, points: 1920, trend: -1 },
121|  { rank: 3, player_id: 1003, name: 'StormBreaker', tier: 26, points: 1880, trend: 2 },
122|  { rank: 4, player_id: 1004, name: 'DarkPulse', tier: 26, points: 1950, trend: -2 },
123|  { rank: 5, player_id: 1005, name: 'BlazeMaster', tier: 26, points: 1680, trend: 1 },
124|  { rank: 6, player_id: 1006, name: 'CrystalVeil', tier: 26, points: 1710, trend: 4 },
125|  { rank: 7, player_id: 1007, name: 'SilverLeaf', tier: 26, points: 1650, trend: -3 },
126|  { rank: 8, player_id: 1008, name: 'NightHawk', tier: 26, points: 1520, trend: 5 },
127|  { rank: 9, player_id: 1009, name: 'FrostByte', tier: 26, points: 1480, trend: -1 },
128|  { rank: 10, player_id: 1010, name: 'ThunderBolt', tier: 26, points: 1350, trend: 0 },
129|  { rank: 11, player_id: 1011, name: 'VoidWalker', tier: 26, points: 1580, trend: 2 },
130|  { rank: 12, player_id: 1012, name: 'LunaRose', tier: 26, points: 1420, trend: -2 },
131|  { rank: 13, player_id: 1013, name: 'EchoChaser', tier: 26, points: 1390, trend: 1 },
132|  { rank: 14, player_id: 1014, name: 'RiftWalker', tier: 26, points: 1310, trend: 3 },
133|  { rank: 15, player_id: 1015, name: 'MysticArc', tier: 26, points: 1280, trend: -4 },
134|  { rank: 16, player_id: 1016, name: 'ZenithBlade', tier: 26, points: 1250, trend: 0 },
135|  { rank: 17, player_id: 1017, name: 'SolarFlare', tier: 26, points: 1220, trend: 2 },
136|  { rank: 18, player_id: 1018, name: 'DreadNova', tier: 26, points: 1190, trend: -1 },
137|  { rank: 19, player_id: 1019, name: 'AetherPulse', tier: 26, points: 1150, trend: -2 },
138|  { rank: 20, player_id: 1020, name: 'NovaStrike', tier: 26, points: 1120, trend: 1 },
139|];
140|
141|// Stat leaderboards — per-class top players
142|export const MOCK_CLASS_LEADERBOARDS: Record<string, Array<{ name: string; champion: string; winRate: number; matches: number }>> = {
143|  Frontline: [
144|    { name: 'IronWill', champion: 'Fernando', winRate: 61.2, matches: 340 },
145|    { name: 'StormBreaker', champion: 'Khan', winRate: 58.7, matches: 285 },
146|    { name: 'VoidWalker', champion: 'Barik', winRate: 57.3, matches: 310 },
147|    { name: 'ThunderBolt', champion: 'Inara', winRate: 56.1, matches: 220 },
148|    { name: 'DreadNova', champion: 'Raum', winRate: 55.8, matches: 195 },
149|  ],
150|  Damage: [
151|    { name: 'DarkPulse', champion: 'Lian', winRate: 63.4, matches: 410 },
152|    { name: 'ShadowStrike', champion: 'Cassie', winRate: 60.1, matches: 375 },
153|    { name: 'SolarFlare', champion: 'Viktor', winRate: 58.9, matches: 350 },
154|    { name: 'CrystalVeil', champion: 'Drogoz', winRate: 57.5, matches: 290 },
155|    { name: 'BlazeMaster', champion: 'Tyra', winRate: 56.2, matches: 260 },
156|  ],
157|  Flank: [
158|    { name: 'NightHawk', champion: 'Androxus', winRate: 64.8, matches: 420 },
159|    { name: 'MysticArc', champion: 'Evie', winRate: 62.3, matches: 380 },
160|    { name: 'FrostByte', champion: 'Maeve', winRate: 59.1, matches: 315 },
161|    { name: 'SilverLeaf', champion: 'Zhin', winRate: 57.6, matches: 275 },
162|    { name: 'ZenithBlade', champion: 'Koga', winRate: 55.4, matches: 240 },
163|  ],
164|  Support: [
165|    { name: 'LunaRose', champion: 'Seris', winRate: 60.5, matches: 360 },
166|    { name: 'EchoChaser', champion: 'Io', winRate: 58.2, matches: 320 },
167|    { name: 'RiftWalker', champion: 'Grover', winRate: 57.8, matches: 295 },
168|    { name: 'AetherPulse', champion: 'Jenos', winRate: 56.4, matches: 250 },
169|    { name: 'NovaStrike', champion: 'Furia', winRate: 54.9, matches: 210 },
170|  ],
171|};
172|
173|// Performance stat leaderboards — GPM, HPM, DPM
174|export const MOCK_STAT_LEADERBOARDS: Record<string, Array<{ name: string; champion: string; value: number }>> = {
175|  GPM: [
176|    { name: 'DarkPulse', champion: 'Lian', value: 2847 },
177|    { name: 'NightHawk', champion: 'Androxus', value: 2691 },
178|    { name: 'ShadowStrike', champion: 'Cassie', value: 2580 },
179|    { name: 'MysticArc', champion: 'Evie', value: 2475 },
180|    { name: 'SolarFlare', champion: 'Viktor', value: 2340 },
181|  ],
182|  HPM: [
183|    { name: 'LunaRose', champion: 'Seris', value: 4120 },
184|    { name: 'EchoChaser', champion: 'Io', value: 3890 },
185|    { name: 'RiftWalker', champion: 'Grover', value: 3650 },
186|    { name: 'IronWill', champion: 'Fernando', value: 1980 },
187|    { name: 'AetherPulse', champion: 'Jenos', value: 3510 },
188|  ],
189|  DPM: [
190|    { name: 'DarkPulse', champion: 'Lian', value: 985 },
191|    { name: 'NightHawk', champion: 'Androxus', value: 920 },
192|    { name: 'ShadowStrike', champion: 'Cassie', value: 875 },
193|    { name: 'CrystalVeil', champion: 'Drogoz', value: 840 },
194|    { name: 'BlazeMaster', champion: 'Tyra', value: 810 },
195|  ],
196|  Tanker: [
197|    { name: 'IronWill', champion: 'Fernando', value: 3240 },
198|    { name: 'StormBreaker', champion: 'Khan', value: 2980 },
199|    { name: 'VoidWalker', champion: 'Barik', value: 2750 },
200|    { name: 'ThunderBolt', champion: 'Inara', value: 2610 },
201|    { name: 'DreadNova', champion: 'Raum', value: 2480 },
202|  ],
203|};
204|
205|// Confirmed cheaters — these are verified bans
206|export const MOCK_CONFIRMED_CHEATERS = [
207|  { name: 'AimBot_King', id: 9001, reason: 'Abnormal accuracy (98.7%)', banned: '2026-06-10' },
208|  { name: 'WallHackPro', id: 9002, reason: 'Tracking through walls', banned: '2026-06-12' },
209|  { name: 'PerfectAimTTV', id: 9004, reason: 'Headshot rate 3x average', banned: '2026-06-14' },
210|];
211|
212|// Suspicious players — under investigation, NOT in confirmed list
213|export const MOCK_SUSPICIOUS_PLAYERS = [
214|  { name: 'SpeedDemon99', id: 9003, reason: 'Movement speed anomaly', severity: 'medium' as const, flagged: '2026-06-08' },
215|  { name: 'Smurf_EzGG', id: 9005, reason: 'Win rate spike (new account)', severity: 'low' as const, flagged: '2026-06-11' },
216|  { name: 'MacroSpammer', id: 9006, reason: 'Inhuman input patterns', severity: 'medium' as const, flagged: '2026-06-09' },
217|  { name: 'InstaLockGod', id: 9007, reason: 'Statistical outlier (top 0.1%)', severity: 'low' as const, flagged: '2026-06-13' },
218|  { name: 'NoRecoil420', id: 9008, reason: 'Zero recoil pattern detected', severity: 'medium' as const, flagged: '2026-06-15' },
219|];
220|
221|// Ranked matches per region per hour (mock live stats)
222|export const MOCK_MATCH_STATS = {
223|  totalToday: 14_287,
224|  rankedToday: 8_432,
225|  regions: [
226|    { region: "NA", matchesPerHour: 420, peakHour: "8 PM EST", totalToday: 3_810 },
227|    { region: "EU", matchesPerHour: 510, peakHour: "9 PM CET", totalToday: 4_590 },
228|    { region: "Asia", matchesPerHour: 280, peakHour: "10 PM JST", totalToday: 2_520 },
229|    { region: "OCE", matchesPerHour: 95, peakHour: "8 PM AEST", totalToday: 855 },
230|    { region: "BR", matchesPerHour: 180, peakHour: "9 PM BRT", totalToday: 1_620 },
231|    { region: "LATAM", matchesPerHour: 115, peakHour: "8 PM CST", totalToday: 1_035 },
232|  ],
233|};
234|
235|// Per-class champion metric data for detail pages
236|// Each metric has per-class stats with champion breakdowns
237|interface ClassMetric {
238|  className: string;
239|  avg: number;
240|  min: number;
241|  max: number;
242|  champions: Array<{ name: string; value: number; matches: number; min: number; max: number; mean: number; mode: number }>;
243|}
244|
245|export const MOCK_METRIC_BY_CLASS: Record<string, Record<string, ClassMetric>> = {
246|  dpm: {
247|    Frontline: {
248|      className: "Frontline", avg: 420, min: 180, max: 680,
249|      champions: [
250|        { name: "Raum", value: 680, matches: 8_420, min: 633, max: 735, mean: 625, mode: 578 },
251|        { name: "Terminus", value: 610, matches: 6_310, min: 542, max: 657, mean: 561, mode: 518 },
252|        { name: "Ash", value: 540, matches: 7_890, min: 395, max: 576, mean: 496, mode: 459 },
253|        { name: "Khan", value: 490, matches: 9_120, min: 487, max: 573, mean: 450, mode: 416 },
254|        { name: "Ruckus", value: 460, matches: 5_640, min: 342, max: 546, mean: 423, mode: 391 },
255|      ],
256|    },
257|    Damage: {
258|      className: "Damage", avg: 890, min: 520, max: 1_420,
259|      champions: [
260|        { name: "Drogoz", value: 1_420, matches: 11_240, min: 1_192, max: 1_435, mean: 1_306, mode: 1_207 },
261|        { name: "Lian", value: 1_280, matches: 14_560, min: 1_069, max: 1_501, mean: 1_177, mode: 1_088 },
262|        { name: "Cassie", value: 1_150, matches: 12_890, min: 916, max: 1_270, mean: 1_058, mode: 977 },
263|        { name: "Viktor", value: 1_040, matches: 16_320, min: 808, max: 1_240, mean: 956, mode: 884 },
264|        { name: "Tyra", value: 980, matches: 10_470, min: 710, max: 1_270, mean: 901, mode: 833 },
265|      ],
266|    },
267|    Flank: {
268|      className: "Flank", avg: 720, min: 340, max: 1_180,
269|      champions: [
270|        { name: "Androxus", value: 1_180, matches: 13_450, min: 1_109, max: 1_202, mean: 1_085, mode: 1_003 },
271|        { name: "Evie", value: 1_020, matches: 8_920, min: 980, max: 1_225, mean: 938, mode: 867 },
272|        { name: "Maeve", value: 940, matches: 11_340, min: 825, max: 1_027, mean: 864, mode: 799 },
273|        { name: "Zhin", value: 810, matches: 9_780, min: 702, max: 1_015, mean: 745, mode: 688 },
274|        { name: "Koga", value: 760, matches: 7_560, min: 615, max: 762, mean: 699, mode: 646 },
275|      ],
276|    },
277|    Support: {
278|      className: "Support", avg: 280, min: 85, max: 520,
279|      champions: [
280|        { name: "Grohk", value: 520, matches: 6_230, min: 408, max: 574, mean: 478, mode: 442 },
281|        { name: "Furia", value: 480, matches: 8_910, min: 380, max: 550, mean: 441, mode: 408 },
282|        { name: "Grover", value: 340, matches: 7_450, min: 274, max: 350, mean: 312, mode: 289 },
283|        { name: "Corvus", value: 290, matches: 5_120, min: 244, max: 324, mean: 266, mode: 246 },
284|        { name: "Jenos", value: 210, matches: 9_340, min: 157, max: 259, mean: 193, mode: 178 },
285|      ],
286|    },
287|  },
288|  hpm: {
289|    Frontline: {
290|      className: "Frontline", avg: 320, min: 0, max: 780,
291|      champions: [
292|        { name: "Terminus", value: 780, matches: 6_310, min: 580, max: 869, mean: 717, mode: 663 },
293|        { name: "Inara", value: 540, matches: 7_120, min: 379, max: 662, mean: 496, mode: 459 },
294|        { name: "Nyx", value: 420, matches: 4_890, min: 340, max: 493, mean: 386, mode: 357 },
295|        { name: "Fernando", value: 280, matches: 11_240, min: 264, max: 301, mean: 257, mode: 238 },
296|        { name: "Ash", value: 120, matches: 7_890, min: 89, max: 150, mean: 110, mode: 102 },
297|      ],
298|    },
299|    Damage: {
300|      className: "Damage", avg: 45, min: 0, max: 180,
301|      champions: [
302|        { name: "Tyra", value: 180, matches: 10_470, min: 156, max: 206, mean: 165, mode: 153 },
303|        { name: "Vivian", value: 120, matches: 6_890, min: 111, max: 146, mean: 110, mode: 102 },
304|        { name: "Viktor", value: 85, matches: 16_320, min: 47, max: 133, mean: 78, mode: 72 },
305|        { name: "Lian", value: 20, matches: 14_560, min: 0, max: 39, mean: 18, mode: 17 },
306|        { name: "Drogoz", value: 0, matches: 11_240, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
307|      ],
308|    },
309|    Flank: {
310|      className: "Flank", avg: 60, min: 0, max: 240,
311|      champions: [
312|        { name: "Buck", value: 240, matches: 5_340, min: 199, max: 250, mean: 220, mode: 204 },
313|        { name: "Skye", value: 160, matches: 6_120, min: 114, max: 192, mean: 147, mode: 136 },
314|        { name: "Maeve", value: 45, matches: 11_340, min: 20, max: 54, mean: 41, mode: 38 },
315|        { name: "Androxus", value: 20, matches: 13_450, min: 0, max: 52, mean: 18, mode: 17 },
316|        { name: "Evie", value: 0, matches: 8_920, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
317|      ],
318|    },
319|    Support: {
320|      className: "Support", avg: 3_240, min: 980, max: 5_800,
321|      champions: [
322|        { name: "Seris", value: 5_800, matches: 15_240, min: 5_224, max: 7_127, mean: 5_336, mode: 4_930 },
323|        { name: "Io", value: 4_620, matches: 12_890, min: 3_898, max: 5_099, mean: 4_250, mode: 3_927 },
324|        { name: "Grover", value: 4_180, matches: 7_450, min: 3_448, max: 4_628, mean: 3_845, mode: 3_553 },
325|        { name: "Ying", value: 3_540, matches: 11_340, min: 3_407, max: 4_200, mean: 3_256, mode: 3_009 },
326|        { name: "Mal Damba", value: 2_980, matches: 8_120, min: 2_363, max: 3_335, mean: 2_741, mode: 2_533 },
327|      ],
328|    },
329|  },
330|  gpm: {
331|    Frontline: {
332|      className: "Frontline", avg: 1_620, min: 980, max: 2_340,
333|      champions: [
334|        { name: "Khan", value: 2_340, matches: 9_120, min: 2_262, max: 2_351, mean: 2_152, mode: 1_989 },
335|        { name: "Fernando", value: 2_180, matches: 11_240, min: 2_032, max: 2_405, mean: 2_005, mode: 1_853 },
336|        { name: "Barik", value: 1_920, matches: 8_450, min: 1_584, max: 1_930, mean: 1_766, mode: 1_632 },
337|        { name: "Inara", value: 1_680, matches: 7_120, min: 1_591, max: 1_820, mean: 1_545, mode: 1_428 },
338|        { name: "Raum", value: 1_420, matches: 8_420, min: 1_271, max: 1_685, mean: 1_306, mode: 1_207 },
339|      ],
340|    },
341|    Damage: {
342|      className: "Damage", avg: 2_140, min: 1_420, max: 3_600,
343|      champions: [
344|        { name: "Lian", value: 3_600, matches: 14_560, min: 3_173, max: 3_749, mean: 3_312, mode: 3_060 },
345|        { name: "Cassie", value: 3_120, matches: 12_890, min: 2_277, max: 3_159, mean: 2_870, mode: 2_652 },
346|        { name: "Viktor", value: 2_840, matches: 16_320, min: 2_632, max: 2_860, mean: 2_612, mode: 2_414 },
347|        { name: "Kinessa", value: 2_480, matches: 9_340, min: 2_248, max: 2_974, mean: 2_281, mode: 2_108 },
348|        { name: "Drogoz", value: 2_280, matches: 11_240, min: 2_142, max: 2_619, mean: 2_097, mode: 1_938 },
349|      ],
350|    },
351|    Flank: {
352|      className: "Flank", avg: 1_980, min: 1_120, max: 3_240,
353|      champions: [
354|        { name: "Androxus", value: 3_240, matches: 13_450, min: 2_989, max: 3_700, mean: 2_980, mode: 2_754 },
355|        { name: "Maeve", value: 2_860, matches: 11_340, min: 2_631, max: 3_457, mean: 2_631, mode: 2_431 },
356|        { name: "Evie", value: 2_420, matches: 8_920, min: 2_152, max: 2_823, mean: 2_226, mode: 2_057 },
357|        { name: "Zhin", value: 2_180, matches: 9_780, min: 1_802, max: 2_577, mean: 2_005, mode: 1_853 },
358|        { name: "Koga", value: 1_840, matches: 7_560, min: 1_791, max: 1_842, mean: 1_692, mode: 1_564 },
359|      ],
360|    },
361|    Support: {
362|      className: "Support", avg: 1_480, min: 820, max: 2_240,
363|      champions: [
364|        { name: "Furia", value: 2_240, matches: 8_910, min: 1_804, max: 2_598, mean: 2_060, mode: 1_904 },
365|        { name: "Grohk", value: 1_980, matches: 6_230, min: 1_844, max: 2_064, mean: 1_821, mode: 1_683 },
366|        { name: "Jenos", value: 1_620, matches: 9_340, min: 1_549, max: 1_804, mean: 1_490, mode: 1_377 },
367|        { name: "Seris", value: 1_340, matches: 15_240, min: 1_226, max: 1_467, mean: 1_232, mode: 1_139 },
368|        { name: "Io", value: 1_120, matches: 12_890, min: 1_070, max: 1_179, mean: 1_030, mode: 952 },
369|      ],
370|    },
371|  },
372|  mpm: {
373|    Frontline: {
374|      className: "Frontline", avg: 2_180, min: 420, max: 4_200,
375|      champions: [
376|        { name: "Inara", value: 4_200, matches: 7_120, min: 3_607, max: 4_340, mean: 3_864, mode: 3_570 },
377|        { name: "Terminus", value: 3_640, matches: 6_310, min: 2_738, max: 4_509, mean: 3_348, mode: 3_094 },
378|        { name: "Nyx", value: 2_840, matches: 4_890, min: 2_718, max: 2_943, mean: 2_612, mode: 2_414 },
379|        { name: "Barik", value: 1_980, matches: 8_450, min: 1_806, max: 2_224, mean: 1_821, mode: 1_683 },
380|        { name: "Fernando", value: 1_420, matches: 11_240, min: 1_404, max: 1_423, mean: 1_306, mode: 1_207 },
381|      ],
382|    },
383|    Damage: {
384|      className: "Damage", avg: 18, min: 0, max: 85,
385|      champions: [
386|        { name: "Vivian", value: 85, matches: 6_890, min: 76, max: 111, mean: 78, mode: 72 },
387|        { name: "Viktor", value: 42, matches: 16_320, min: 4, max: 90, mean: 38, mode: 35 },
388|        { name: "Tyra", value: 15, matches: 10_470, min: 0, max: 61, mean: 13, mode: 12 },
389|        { name: "Lian", value: 0, matches: 14_560, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
390|        { name: "Cassie", value: 0, matches: 12_890, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
391|      ],
392|    },
393|    Flank: {
394|      className: "Flank", avg: 25, min: 0, max: 180,
395|      champions: [
396|        { name: "Vora", value: 180, matches: 6_120, min: 129, max: 226, mean: 165, mode: 153 },
397|        { name: "Zhin", value: 95, matches: 9_780, min: 49, max: 100, mean: 87, mode: 80 },
398|        { name: "Vatu", value: 35, matches: 5_340, min: 25, max: 71, mean: 32, mode: 29 },
399|        { name: "Maeve", value: 0, matches: 11_340, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
400|        { name: "Androxus", value: 0, matches: 13_450, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
401|      ],
402|    },
403|    Support: {
404|      className: "Support", avg: 85, min: 0, max: 420,
405|      champions: [
406|        { name: "Io", value: 420, matches: 12_890, min: 328, max: 521, mean: 386, mode: 357 },
407|        { name: "Grover", value: 280, matches: 7_450, min: 202, max: 302, mean: 257, mode: 238 },
408|        { name: "Furia", value: 120, matches: 8_910, min: 96, max: 144, mean: 110, mode: 102 },
409|        { name: "Seris", value: 45, matches: 15_240, min: 0, max: 92, mean: 41, mode: 38 },
410|        { name: "Jenos", value: 0, matches: 9_340, min: 0.0, max: 0.0, mean: 0.0, mode: 0.0 },
411|      ],
412|    },
413|  },
414|  kda: {
415|    Frontline: {
416|      className: "Frontline", avg: 1.8, min: 0.9, max: 2.8,
417|      champions: [
418|        { name: "Khan", value: 2.8, matches: 9_120, min: 1.1, max: 5.0, mean: 2.7, mode: 2.4 },
419|        { name: "Fernando", value: 2.4, matches: 11_240, min: 1.0, max: 4.3, mean: 2.3, mode: 2.0 },
420|        { name: "Ash", value: 2.1, matches: 7_890, min: 0.8, max: 3.8, mean: 2.0, mode: 1.8 },
421|        { name: "Barik", value: 1.9, matches: 8_450, min: 0.8, max: 3.4, mean: 1.8, mode: 1.6 },
422|        { name: "Inara", value: 1.4, matches: 7_120, min: 0.6, max: 2.5, mean: 1.3, mode: 1.2 },
423|      ],
424|    },
425|    Damage: {
426|      className: "Damage", avg: 2.4, min: 1.2, max: 3.8,
427|      champions: [
428|        { name: "Lian", value: 3.8, matches: 14_560, min: 1.5, max: 6.8, mean: 3.6, mode: 3.2 },
429|        { name: "Cassie", value: 3.4, matches: 12_890, min: 1.4, max: 6.1, mean: 3.2, mode: 2.9 },
430|        { name: "Kinessa", value: 3.1, matches: 9_340, min: 1.2, max: 5.6, mean: 2.9, mode: 2.6 },
431|        { name: "Viktor", value: 2.6, matches: 16_320, min: 1.0, max: 4.7, mean: 2.5, mode: 2.2 },
432|        { name: "Drogoz", value: 2.2, matches: 11_240, min: 0.9, max: 4.0, mean: 2.1, mode: 1.9 },
433|      ],
434|    },
435|    Flank: {
436|      className: "Flank", avg: 2.6, min: 1.1, max: 4.2,
437|      champions: [
438|        { name: "Androxus", value: 4.2, matches: 13_450, min: 1.7, max: 7.6, mean: 4.0, mode: 3.6 },
439|        { name: "Evie", value: 3.8, matches: 8_920, min: 1.5, max: 6.8, mean: 3.6, mode: 3.2 },
440|        { name: "Maeve", value: 3.4, matches: 11_340, min: 1.4, max: 6.1, mean: 3.2, mode: 2.9 },
441|        { name: "Vatu", value: 2.8, matches: 5_340, min: 1.1, max: 5.0, mean: 2.7, mode: 2.4 },
442|        { name: "Zhin", value: 2.1, matches: 9_780, min: 0.8, max: 3.8, mean: 2.0, mode: 1.8 },
443|      ],
444|    },
445|    Support: {
446|      className: "Support", avg: 2.1, min: 0.8, max: 3.6,
447|      champions: [
448|        { name: "Furia", value: 3.6, matches: 8_910, min: 1.4, max: 6.5, mean: 3.4, mode: 3.1 },
449|        { name: "Grohk", value: 2.9, matches: 6_230, min: 1.2, max: 5.2, mean: 2.8, mode: 2.5 },
450|        { name: "Jenos", value: 2.4, matches: 9_340, min: 1.0, max: 4.3, mean: 2.3, mode: 2.0 },
451|        { name: "Ying", value: 2.0, matches: 11_340, min: 0.8, max: 3.6, mean: 1.9, mode: 1.7 },
452|        { name: "Seris", value: 1.5, matches: 15_240, min: 0.6, max: 2.7, mean: 1.4, mode: 1.3 },
453|      ],
454|    },
455|  },
456|};
457|export const MOCK_ITEM_STATS = [
458|  // Offense
459|  { name: "Bulldozer", pickRate: 23.5, winRate: 48.3, category: "Offense", icon: "/images/items/Bulldozer_Icon.avif" },
460|  { name: "Deft Hands", pickRate: 31.7, winRate: 50.1, category: "Offense", icon: "/images/items/Deft_Hands_Icon.avif" },
461|  { name: "Lethality", pickRate: 18.4, winRate: 49.6, category: "Offense", icon: "/images/items/Lethality_Icon.avif" },
462|  { name: "Trigger Scent", pickRate: 11.6, winRate: 48.5, category: "Offense", icon: "/images/items/Trigger_Scent_Icon.avif" },
463|  { name: "Wrecker", pickRate: 68.1, winRate: 49.8, category: "Offense", icon: "/images/items/Wrecker_Icon.avif" },
464|  // Defense
465|  { name: "Blast Shields", pickRate: 44.6, winRate: 50.3, category: "Defense", icon: "/images/items/Blast_Shields_Icon.avif" },
466|  { name: "Guardian", pickRate: 14.2, winRate: 47.9, category: "Defense", icon: "/images/items/Guardian_Icon.avif" },
467|  { name: "Haven", pickRate: 71.8, winRate: 52.9, category: "Defense", icon: "/images/items/Haven_Icon.avif" },
468|  { name: "Resilience", pickRate: 52.3, winRate: 50.7, category: "Defense", icon: "/images/items/Resilience_Icon.avif" },
469|  { name: "Sentinel", pickRate: 9.8, winRate: 46.4, category: "Defense", icon: "/images/items/Sentinel_Icon.avif" },
470|  // Healing
471|  { name: "Bloodbath", pickRate: 21.5, winRate: 51.1, category: "Healing", icon: "/images/items/Bloodbath_Icon.avif" },
472|  { name: "Life Rip", pickRate: 42.7, winRate: 50.8, category: "Healing", icon: "/images/items/Life_Rip_Icon.avif" },
473|  { name: "Meditation", pickRate: 27.3, winRate: 50.2, category: "Healing", icon: "/images/items/Meditation_Icon.avif" },
474|  { name: "Rejuvenate", pickRate: 38.4, winRate: 51.5, category: "Healing", icon: "/images/items/Rejuvenate_Icon.avif" },
475|  { name: "Veteran", pickRate: 8.2, winRate: 46.1, category: "Healing", icon: "/images/items/Veteran_Icon.avif" },
476|  // Utility
477|  { name: "Chronos", pickRate: 39.8, winRate: 51.9, category: "Utility", icon: "/images/items/Chronos_Icon.avif" },
478|  { name: "Hoard", pickRate: 15.3, winRate: 47.8, category: "Utility", icon: "/images/items/Hoard_Icon.avif" },
479|  { name: "Master Riding", pickRate: 12.4, winRate: 47.2, category: "Utility", icon: "/images/items/Master_Riding_Icon.avif" },
480|  { name: "Morale Boost", pickRate: 45.2, winRate: 52.6, category: "Utility", icon: "/images/items/Morale_Boost_Icon.avif" },
481|  { name: "Nimble", pickRate: 58.9, winRate: 51.8, category: "Utility", icon: "/images/items/Nimble_Icon.avif" },
482|];
483|
484|// Map stats
485|export const MOCK_MAP_STATS = [
486|  { name: "Jaguar Falls", matches: 18_420, avgDuration: "12:34" },
487|  { name: "Serpent Beach", matches: 16_890, avgDuration: "11:52" },
488|  { name: "Fish Market", matches: 15_340, avgDuration: "13:10" },
489|  { name: "Frog Isle", matches: 14_720, avgDuration: "10:45" },
490|  { name: "Stone Keep", matches: 13_580, avgDuration: "14:22" },
491|  { name: "Brightmarsh", matches: 12_910, avgDuration: "11:18" },
492|  { name: "Ascension Peak", matches: 11_460, avgDuration: "12:08" },
493|  { name: "Ice Mines", matches: 10_840, avgDuration: "13:45" },
494|  { name: "Splitstone Quarry", matches: 9_670, avgDuration: "11:30" },
495|  { name: "Warder's Gate", matches: 8_920, avgDuration: "12:55" },
496|];
497|
498|// Global performance metrics with distribution
499|export const MOCK_GLOBAL_METRICS = {
500|  dpm: { min: 85, max: 1_420, mean: 682, mode: 540 },
501|