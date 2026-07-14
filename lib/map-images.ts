const NON_RANKED_MAP_ARTWORK: Record<string, string> = {
  "ascension peak": "Ascension_Peak_Overhead_Layout",
  brightmarsh: "Brightmarsh_Overhead_Layout",
  "dragon arena": "Dragon_Arena_Overhead_Layout",
  "fish market": "Fish Market Overhead",
  "foremans rise": "Foremans_Rise_Overhead_Layout",
  "frog isle": "Frog_Isle_Overhead_Layout",
  "jaguar falls": "Jaguar_Falls_Overhead_Layout",
  "serpent beach": "Serpent_Beach_Overhead_Layout",
  "snowfall junction": "Snowfall_Junction_Overhead_Layout",
  "splitstone quarry": "Splotstone_Quarry_Overhead_Layout",
  "stone keep": "Stone_Keep_Overhead_Layout",
  "warders gate": "Warders_Gate_Overhead_Layout",
  // These maps currently have loading-card artwork but no overhead asset.
  bazaar: "Ranked_Bazaar",
  "ice mines": "Ranked_Ice_Mines",
};

function assetSegment(value: string): string {
  return value.replace(/[’']/g, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
}

function mapLookupKey(value: string): string {
  return value
    .replace(/^(?:live|casual)\s+/i, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function mapImagePath(mapName: string): string {
  const trimmed = mapName.trim();
  // Ranked map names already correspond to the published Ranked_*.png assets.
  // Hi-Rez prefixes casual/live Siege map names with "LIVE" instead. Resolve
  // those names to the available overhead artwork rather than emitting a
  // guaranteed-missing path such as LIVE_Frog_Isle.png.
  if (!/^ranked\s+/i.test(trimmed)) {
    const artwork = NON_RANKED_MAP_ARTWORK[mapLookupKey(trimmed)];
    if (artwork) return `/images/maps/${artwork}.png`;
  }

  return `/images/maps/${assetSegment(trimmed)}.png`;
}
