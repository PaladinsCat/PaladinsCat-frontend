/** Local scoreboard prototype for reviewing the platform marks in context. · refs: none */

import BrowserScoreboard from "@/components/match-result/browser-scoreboard";
import PlatformIcon from "@/components/platform-icon";
import type { MatchData, MatchPlayerDetail, MatchBan } from "@/lib/api-client";
import type { MatchResultPlayer, PlayerProfileData } from "@/components/match-result/types";

const platformLegend = ["Steam", "Epic Games", "PlayStation", "XboxLive", "Hi-Rez"];

const champions = [
  ["Viktor", 1], ["Seris", 57], ["Ash", 10], ["Koga", 77], ["Lian", 39],
  ["Fernando", 12], ["Ying", 20], ["Maeve", 57], ["Raum", 83], ["Tyra", 14],
] as const;

function mockPlayer(
  id: number,
  name: string,
  championIndex: number,
  taskForce: 1 | 2,
  platform: string,
  kills: number,
  deaths: number,
  assists: number,
): MatchResultPlayer {
  const [championName, championId] = champions[championIndex]!;
  const damage = 15000 + kills * 1150 + assists * 260;
  const healing = championName === "Seris" || championName === "Ying" ? 9200 : 500 + assists * 180;
  const snapshot = {
    captured_at: "2026-09-05T18:00:00Z",
    source: "post_match_ingest" as const,
    level: 90 - (id % 33),
    platform,
    region: "NA",
    global_wins: 320 + id,
    global_losses: 180 + id,
    kbm_tier: taskForce === 1 ? 18 : 17,
    kbm_points: 70 + id,
    kbm_rank: id,
    kbm_wins: 120 + id,
    kbm_losses: 65 + id,
    champion_wins: 40 + id,
    champion_losses: 20 + id,
    queue_elo: 1510 + id,
    champion_elo: 1600 + id,
    cheater: false,
    exploiter: false,
    sus_count: 0,
    verified: id === 1,
  };

  const matchData: MatchPlayerDetail = {
    player_id: id,
    player_name: name,
    champion_id: championId,
    champion_name: championName,
    skin_id: 0,
    skin_name: "Default",
    kills,
    deaths,
    assists,
    damage_done_physical: damage,
    damage_done_magical: 0,
    damage_done_in_hand: damage,
    damage_taken: 11000 + deaths * 700,
    damage_mitigated: championName === "Ash" || championName === "Fernando" || championName === "Raum" ? 8500 : 1200,
    healing,
    healing_self: 0,
    healing_bot: 0,
    healing_player_self: 0,
    gold_earned: 2800 + id * 30,
    objective_assists: 25 + assists * 2,
    win_status: taskForce === 1 ? "Winner" : "Loser",
    task_force: taskForce,
    league_tier: "18",
    league_points: 70,
    league_wins: 120,
    league_losses: 65,
    account_level: snapshot.level,
    mastery_level: 30,
    platform,
    region: "NA",
    tier: 18,
    source: "post_match_ingest",
    party_id: id < 3 ? 101 : null,
    party: id < 3 ? 1 : null,
    final_match_level: snapshot.level,
    kda: (kills + assists) / Math.max(1, deaths),
    damage_per_minute: damage / 13,
    healing_per_minute: healing / 13,
    healing_self_per_minute: 0,
    time_in_match: 13 * 60,
    afk_rate: 0,
    profile_snapshot: snapshot,
  };

  const profileData: PlayerProfileData = {
    id: String(id),
    name,
    level: snapshot.level,
    platform,
    region: "NA",
    kbmTier: snapshot.kbm_tier,
    kbmPoints: snapshot.kbm_points,
    kbmRank: snapshot.kbm_rank,
    queueElo: snapshot.queue_elo,
    championElo: snapshot.champion_elo,
    globalWins: snapshot.global_wins,
    globalLosses: snapshot.global_losses,
    globalWinRate: (snapshot.global_wins / (snapshot.global_wins + snapshot.global_losses)) * 100,
    rankedWins: snapshot.kbm_wins,
    rankedLosses: snapshot.kbm_losses,
    verified: snapshot.verified,
    totalMatches: snapshot.global_wins + snapshot.global_losses,
    totalWins: snapshot.global_wins,
    winRate: (snapshot.global_wins / (snapshot.global_wins + snapshot.global_losses)) * 100,
    totalPlays: snapshot.global_wins + snapshot.global_losses,
    topChampions: [],
  };

  return { matchData, profileData };
}

const match: MatchData = {
  match_id: 1281943720,
  entry_datetime: "2026-09-05T18:00:00Z",
  map: "Ranked Bazaar",
  queue_id: 486,
  queue_name: "Ranked Siege",
  stats_scope: "ranked",
  participant_model: "match",
  is_custom: false,
  duration_seconds: 780,
  region: "NA",
  team1_score: 4,
  team2_score: 2,
  winning_task_force: 1,
  is_ranked: true,
  recovered: false,
  broken: false,
  private: false,
  limited: false,
};

const team1 = [
  mockPlayer(1, "nabicooktv", 0, 1, "Steam", 18, 3, 9),
  mockPlayer(2, "Vexxa", 1, 1, "Epic Games", 8, 5, 17),
  mockPlayer(3, "Aeri", 2, 1, "PlayStation", 10, 5, 11),
  mockPlayer(4, "Rook", 3, 1, "XboxLive", 12, 6, 8),
  mockPlayer(5, "Morrow", 4, 1, "Hi-Rez", 14, 4, 10),
];

const team2 = [
  mockPlayer(6, "Kestrel", 5, 2, "Steam", 9, 12, 6),
  mockPlayer(7, "Pyre", 6, 2, "Epic Games", 5, 11, 14),
  mockPlayer(8, "Nova", 7, 2, "PlayStation", 10, 10, 5),
  mockPlayer(9, "Warden", 8, 2, "Xbox", 7, 13, 8),
  mockPlayer(10, "Sable", 9, 2, "Hi-Rez", 8, 12, 5),
];

const bans: MatchBan[] = [
  { ban_slot: 1, champion_id: 2, champion_name: "Bomb King" },
  { ban_slot: 2, champion_id: 5, champion_name: "Drogoz" },
  { ban_slot: 3, champion_id: 7, champion_name: "Evie" },
  { ban_slot: 4, champion_id: 8, champion_name: "Inara" },
];

export default function ScoreboardPrototypePage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pc-accent">Local prototype</p>
        <h1 className="pc-heading pc-heading-lg mt-2">Scoreboard platform icons</h1>
        <p className="mt-2 max-w-2xl text-sm text-pc-text-muted">Review the monochrome platform marks in the real scoreboard layout. Hover an icon in a player row for its accessible label.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-pc-text-secondary">
          {platformLegend.map((platform) => <span key={platform} className="inline-flex items-center gap-2"><PlatformIcon platform={platform} /><span>{platform === "Hi-Rez" ? "Hi-Rez / PC" : platform}</span></span>)}
        </div>
      </div>
      <BrowserScoreboard match={match} queueLabel="Ranked Siege" team1={team1} team2={team2} bans={bans} />
    </div>
  );
}
