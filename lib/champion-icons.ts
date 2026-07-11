// Champion icon paths — auto-resolved from public/images/champions/
// Pattern: /images/champions/Champion {Name} Icon.avif
// Generic fallback for champions without icons

const GENERIC_ICON = "/images/champions/Champion_Generic_Icon.avif";

/**
 * Mapping for champions whose display name doesn't directly match the file name.
 * 
 * Pattern: all icons live at `/images/champions/Champion {Name} Icon.avif`
 * Most champions (57/59) have name = filename.
 * These 4 need special mapping:
 *   "Betty La Bomba" → "Champion BettyLaBomba Icon.avif"
 *   "Bomb King"      → "Champion BombKing Icon.avif"
 *   "Sha Lin"        → "Champion ShaLin Icon.avif"
 *   "Mal Damba"      → "Champion Mal'Damba Icon.avif" (apostrophe in filename)
 */
const ICON_NAME_MAP: Record<string, string> = {
  'Betty La Bomba': 'Champion BettyLaBomba Icon.avif',
  'Bomb King': 'Champion BombKing Icon.avif',
  'Sha Lin': 'Champion ShaLin Icon.avif',
  'Mal Damba': "Champion Mal'Damba Icon.avif",
};

/**
 * Return the generic champion icon path.
 */
export function getGenericChampionIcon(): string {
  return GENERIC_ICON;
}

/**
 * Get the icon path for a champion, automatically falling back to generic.
 * All 59 real Paladins champions have icon files. This always returns the correct path.
 */
export function getChampionIconSafe(name: string | null | undefined): string {
  if (!name) return GENERIC_ICON;
  const normalizedName = name.trim();
  // Check for special name mapping
  if (ICON_NAME_MAP[normalizedName]) {
    return `/images/champions/${ICON_NAME_MAP[normalizedName]}`;
  }
  // Default: name matches filename directly
  return `/images/champions/Champion ${normalizedName} Icon.avif`;
}
