const DEFAULT_MAP_ARTWORK = "Test_Maps_Loading";

const RANKED_MAP_ARTWORK: Record<string, string> = {
  "ascension peak": "Ranked_Ascension_Peak",
  bazaar: "Ranked_Bazaar",
  brightmarsh: "Ranked_Brightmarsh",
  "frog isle": "Ranked_Frog_Isle",
  "ice mines": "Ranked_Ice_Mines",
  "jaguar falls": "Ranked_Jaguar_Falls",
  "serpent beach": "Ranked_Serpent_Beach",
  "splitstone quarry": "Ranked_Splitstone_Quarry",
  "stone keep classic": "Ranked_Stone_Keep_Classic",
  "stone keep v2 night": "Ranked_Stone_Keep_V2_Night",
  "warders gate": "Ranked_Warders_Gate",
};

const MAP_ARTWORK: Record<string, string> = {
  abyss: "Abyss_Loading",
  "ascension peak": "Ascension_Peak_Overhead_Layout",
  brightmarsh: "Brightmarsh_Overhead_Layout",
  dawnforge: "Dawnforge_Loading",
  "dragon arena": "Dragon_Arena_Overhead_Layout",
  "fish market": "Fish Market Overhead",
  "foremans rise": "Foremans_Rise_Overhead_Layout",
  "frostbite cavern": "Frostbite_Cavern_Loading",
  "frozen guard": "Frozen_Guard_Loading",
  "frog isle": "Frog_Isle_Overhead_Layout",
  "greenwood outpost": "Greenwood_Outpost_Loading",
  "hidden temple": "Hidden_Temple_Loading",
  "jaguar falls": "Jaguar_Falls_Overhead_Layout",
  "magistrates archives": "Magistrates_Archives_Loading",
  "marauders port": "Marauders_Port_Loading",
  "primal court": "Primal_Court_Loading",
  "serpent beach": "Serpent_Beach_Overhead_Layout",
  "shattered desert": "Shattered_Desert_Loading",
  "shooting range": "Shooting_Range_Loading",
  "snowfall junction": "Snowfall_Junction_Overhead_Layout",
  "splitstone quarry": "Splotstone_Quarry_Overhead_Layout",
  "stone keep": "Stone_Keep_Overhead_Layout",
  "test maps": "Test_Maps_Loading",
  throne: "Throne_Loading",
  "timber mill": "Timber_Mill_Loading",
  "trade district": "Trade_District_Loading",
  tutorial: "Tutorial_Loading",
  "warders gate": "Warders_Gate_Overhead_Layout",
  // These maps currently have loading-card artwork but no overhead asset.
  bazaar: "Ranked_Bazaar",
  "ice mines": "Ranked_Ice_Mines",
};

function mapLookupKey(value: string): string {
  return value
    .replace(/^(?:live|casual)\s+/i, "")
    .replace(/\s+\((?:onslaught|king of the hill|koth|team deathmatch|tdm|siege|payload)\)\s*$/i, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function mapImagePath(mapName: string): string {
  const trimmed = mapName.trim();
  const lookupKey = mapLookupKey(trimmed.replace(/^ranked\s+/i, ""));
  const artwork = /^ranked\s+/i.test(trimmed)
    ? RANKED_MAP_ARTWORK[lookupKey] ?? MAP_ARTWORK[lookupKey]
    : MAP_ARTWORK[lookupKey];

  // A neutral map card is preferable to a missing wallpaper for historic,
  // experimental, or newly introduced maps without published loading art.
  return `/images/maps/${artwork ?? DEFAULT_MAP_ARTWORK}.png`;
}

export function mapImageSources(mapName: string): { avif: string; png: string } {
  const png = mapImagePath(mapName);
  return { avif: png.replace(/\.png$/, ".avif"), png };
}
