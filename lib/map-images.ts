const DEFAULT_MAP_ARTWORK = "Test_Maps_Loading";
const DEFAULT_MATCH_MAP_ARTWORK = "Match_Test_Maps";

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
  "stone keep classic": "Stone_Keep_Overhead_Layout",
  "stone keep v2 night": "Stone_Keep_Overhead_Layout",
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

const MATCH_MAP_ARTWORK: Record<string, string> = {
  abyss: "Match_Abyss",
  "ascension peak": "Match_Ascension_Peak",
  bazaar: "Match_Bazaar",
  brightmarsh: "Match_Brightmarsh",
  dawnforge: "Match_Dawnforge",
  "dragon arena": "Match_Dragon_Arena",
  "fish market": "Match_Fish_Market",
  "foremans rise": "Match_Foremans_Rise",
  "frostbite cavern": "Match_Frostbite_Cavern",
  "frozen guard": "Match_Frozen_Guard",
  "frog isle": "Match_Frog_Isle",
  "greenwood outpost": "Match_Greenwood_Outpost",
  "hidden temple": "Match_Hidden_Temple",
  "ice mines": "Match_Ice_Mines",
  "jaguar falls": "Match_Jaguar_Falls",
  "magistrates archives": "Match_Magistrates_Archives",
  "marauders port": "Match_Marauders_Port",
  "primal court": "Match_Primal_Court",
  "serpent beach": "Match_Serpent_Beach",
  "shattered desert": "Match_Shattered_Desert",
  "shooting range": "Match_Shooting_Range",
  "snowfall junction": "Match_Snowfall_Junction",
  "splitstone quarry": "Match_Splitstone_Quarry",
  "stone keep": "Match_Stone_Keep",
  "stone keep classic": "Match_Stone_Keep_Classic",
  "stone keep v2 night": "Match_Stone_Keep_V2_Night",
  "test maps": "Match_Test_Maps",
  throne: "Match_Throne",
  "timber mill": "Match_Timber_Mill",
  "trade district": "Match_Trade_District",
  tutorial: "Match_Tutorial",
  "warders gate": "Match_Warders_Gate",
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
  const lookupKey = mapLookupKey(mapName.trim().replace(/^ranked\s+/i, ""));
  const artwork = MAP_ARTWORK[lookupKey];

  // A neutral map card is preferable to a missing wallpaper for historic,
  // experimental, or newly introduced maps without published loading art.
  return `/images/maps/${artwork ?? DEFAULT_MAP_ARTWORK}.png`;
}

export function matchMapImagePath(mapName: string): string {
  const lookupKey = mapLookupKey(mapName.trim().replace(/^ranked\s+/i, ""));
  const artwork = MATCH_MAP_ARTWORK[lookupKey] ?? DEFAULT_MATCH_MAP_ARTWORK;
  return `/images/maps/${artwork}.png`;
}

export function matchMapImageSources(mapName: string): { avif: string; png: string } {
  const png = matchMapImagePath(mapName);
  return { avif: png.replace(/\.png$/, ".avif"), png };
}
