/** Read cumulative ranked champion relationships through the shared API transport.
 * refs: endpoints: GET /stats/champions/{champion_id}/matchups · migrations: 176
 */
import { fetchJson } from "@/lib/api-client";

export interface ChampionRelationship {
  opponentChampionId: number;
  opponentChampionName: string;
  wins: number;
  losses: number;
  encounters: number;
  winRate: number | null;
}

export interface ChampionTalentMatchupRow {
  opponentChampionId: number;
  opponentChampionName: string;
  opponentTalentId: number;
  opponentTalentName: string;
  wins: number;
  losses: number;
  encounters: number;
  coverageFrom: string;
  coverageTo: string;
}

export interface ChampionTalentMatchups {
  talents: Array<{ talentId: number; talentName: string }>;
  rows: ChampionTalentMatchupRow[];
}

/** Load every opponent relationship across stored ranked history. */
export async function fetchChampionRelationships(
  championId: number,
  signal: AbortSignal,
): Promise<ChampionRelationship[]> {
  const matchup = await fetchChampionTalentMatchups(championId, 0, signal);
  const totals = new Map<number, ChampionRelationship>();
  for (const row of matchup.rows) {
    const current = totals.get(row.opponentChampionId) ?? {
      opponentChampionId: row.opponentChampionId,
      opponentChampionName: row.opponentChampionName,
      wins: 0,
      losses: 0,
      encounters: 0,
      winRate: null,
    };
    current.wins += row.wins;
    current.losses += row.losses;
    current.encounters += row.encounters;
    current.winRate = current.encounters ? (100 * current.wins) / current.encounters : null;
    totals.set(row.opponentChampionId, current);
  }
  return [...totals.values()].sort((left, right) => (right.winRate ?? 0) - (left.winRate ?? 0));
}

interface RawChampionTalentMatchups {
  talents: Array<{ talent_id: number; talent_name: string }>;
  rows: Array<{
    opponent_champion_id: number;
    opponent_champion_name: string;
    opponent_talent_id: number;
    opponent_talent_name: string;
    wins: number | string;
    losses: number | string;
    samples: number | string;
    coverage_from: string;
    coverage_to: string;
  }>;
}

/** Load the selected champion talent's observed ranked matchups. */
export async function fetchChampionTalentMatchups(
  championId: number,
  talentId: number,
  signal: AbortSignal,
): Promise<ChampionTalentMatchups> {
  const query = new URLSearchParams({ queueId: "486", days: "all" });
  if (talentId > 0) query.set("talentId", String(talentId));
  const result = await fetchJson<RawChampionTalentMatchups>(
    `/stats/champions/${championId}/matchups?${query}`,
    { signal, retries: 0 },
  );
  return {
    talents: result.talents.map((talent) => ({
      talentId: Number(talent.talent_id),
      talentName: talent.talent_name,
    })),
    rows: result.rows.map((row) => ({
      opponentChampionId: Number(row.opponent_champion_id),
      opponentChampionName: row.opponent_champion_name,
      opponentTalentId: Number(row.opponent_talent_id),
      opponentTalentName: row.opponent_talent_name,
      wins: Number(row.wins),
      losses: Number(row.losses),
      encounters: Number(row.samples),
      coverageFrom: row.coverage_from,
      coverageTo: row.coverage_to,
    })),
  };
}

export interface ChampionMatchupPreviews {
  champions: Array<{
    championId: number;
    strong: ChampionRelationship[];
    weak: ChampionRelationship[];
  }>;
}

interface RawChampionMatchupPreviews {
  champions: Array<{
    champion_id: number;
    strong: ChampionRelationship[];
    weak: ChampionRelationship[];
  }>;
}

/** Load the five strongest and weakest opponents for every reference champion. */
export async function fetchChampionMatchupPreviews(signal: AbortSignal): Promise<ChampionMatchupPreviews> {
  const result = await fetchJson<RawChampionMatchupPreviews>(
    "/stats/champions/matchup-previews?days=all",
    { signal, retries: 0 },
  );
  const normalize = (relationship: ChampionRelationship): ChampionRelationship => ({
    ...relationship,
    wins: Number(relationship.wins),
    losses: Number(relationship.losses),
    encounters: Number(relationship.encounters),
    winRate: relationship.winRate == null ? null : Number(relationship.winRate),
  });
  return {
    champions: result.champions.map((row) => ({
      championId: Number(row.champion_id),
      strong: row.strong.map(normalize),
      weak: row.weak.map(normalize),
    })),
  };
}
