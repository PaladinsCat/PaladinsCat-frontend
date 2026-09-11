/**
 * Catalog the built-in full-scene wallpapers and their AVIF/PNG variants.
 *
 * This module exposes local asset paths only; it does not include tactical maps or perform network work.
 * refs: none
 */
/**
 * Define built in wallpaper as `{ avif: string; png: string }`.
 * refs: none
 */
export type BuiltInWallpaper = { avif: string; png: string };

const WALLPAPER_IDS = [
  "androxus-moonlight",
  "dj-maeve",
  "inara-forest",
] as const;

// Full-scene artwork only. Tactical overhead map layouts remain available to
// map-specific views but are intentionally excluded from the site wallpaper.
/**
 * Build the default wallpaper asset list from the checked-in artwork IDs.
 *
 * Returns local AVIF and PNG paths without network, authentication, cache, or persistence effects.
 * refs: none
 */
export const DEFAULT_WALLPAPERS: BuiltInWallpaper[] = WALLPAPER_IDS.map((id) => ({
  avif: `/images/wallpapers/${id}.avif`,
  png: `/images/wallpapers/${id}.png`,
}));
