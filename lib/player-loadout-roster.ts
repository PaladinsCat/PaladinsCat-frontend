/**
 * Saved decks use Hi-Rez champion IDs, not the compact display-order IDs in
 * Builds player loadout roster display data.
 * refs: none
 */
import { fetchChampions } from "@/lib/api-client";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";

/**
 * Define player loadout champion as `{ id: number; name: string; roles: string[] }`.
 * refs: none
 */
export type PlayerLoadoutChampion = { id: number; name: string; roles: string[] };

let rosterPromise: Promise<PlayerLoadoutChampion[]> | null = null;

/**
 * Saved decks use Hi-Rez champion IDs, not the compact display-order IDs in
 * static-champions.ts. Use the database catalog for links and filters so deck
 * rows, card references, and player loadouts share one identity.
 * refs: none
 * I/O types: `none -> Promise<PlayerLoadoutChampion[]>`.
 */
export function getPlayerLoadoutChampionRoster(): Promise<PlayerLoadoutChampion[]> {
  if (!rosterPromise) {
    rosterPromise = fetchChampions({ limit: "200" })
      .then((champions) => champions.map((champion) => ({ id: champion.id, name: champion.name, roles: champion.roles ?? [] })))
      .then((champions) => champions.length >= 50 ? champions : STATIC_CHAMPIONS)
      .catch(() => STATIC_CHAMPIONS);
  }
  return rosterPromise;
}
