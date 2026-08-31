/**
 * Catalog the built-in full-scene wallpapers and their AVIF/PNG variants.
 *
 * This module exposes local asset paths only; it does not include tactical maps or perform network work.
 */
export type BuiltInWallpaper = { avif: string; png: string };

const WALLPAPER_IDS = [
  "1024399",
  "1024395",
  "1024394",
  "1024390",
  "1024421",
  "1024418",
  "1024425",
  "1024416",
  "1024415",
  "1024405",
  "1024406",
  "1024387",
  "1024389",
  "1024401",
  "1024412",
  "1024420",
  "1024411",
  "1024409",
  "1024408",
] as const;

// Full-scene artwork only. Tactical overhead map layouts remain available to
// map-specific views but are intentionally excluded from the site wallpaper.
/**
 * Build the default wallpaper asset list from the checked-in artwork IDs.
 *
 * Returns local AVIF and PNG paths without network, authentication, cache, or persistence effects.
 */
export const DEFAULT_WALLPAPERS: BuiltInWallpaper[] = WALLPAPER_IDS.map((id) => ({
  avif: `/images/wallpapers/${id}.avif`,
  png: `/images/wallpapers/${id}.png`,
}));
