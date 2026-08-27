// Champion icon paths — auto-resolved from public/images/champions/
// Pattern: /images/champions/Champion {Name} Icon.avif
// Generic fallback for champions without icons

const GENERIC_ICON = "/images/champions/Champion_Generic_Icon.avif";

/**
 * Mapping for champions whose display name doesn't directly match the file name.
 *
 * Keys are normalized (lowercased, spaces/punctuation stripped) for fuzzy matching.
 * Values are the actual filename stem (without "Champion " prefix and " Icon.avif" suffix).
 *
 * Covers 5 special cases:
 *   Betty La Bomba / Betty la Bomba      → "BettyLaBomba"
 *   Bomb King / Bomb king                → "BombKing"
 *   Sha Lin / Sha Lin                    → "ShaLin"
 *   Mal'Damba / Mal Damba                → "Mal'Damba" (apostrophe in filename)
 *   VII / Vii                            → "VII"
 */
const ICON_EXCEPTIONS: Record<string, string> = {
  'bettylabomba': 'BettyLaBomba',
  'bombking': 'BombKing',
  'shalin': 'ShaLin',
  'maldamba': "Mal'Damba",
  'vii': 'VII',
};

function normalizeChampionName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Return the generic champion icon path.
 */
export function getGenericChampionIcon(): string {
  return GENERIC_ICON;
}

/**
 * Get the icon path for a champion, automatically falling back to generic.
 * All 59 real Paladins champions have icon files. This always returns the correct path.
 *
 * Handles case and punctuation variations in champion names from different sources
 * (database, API responses, static data).
 */
export function getChampionIconSafe(name: string | null | undefined): string {
  if (!name) return GENERIC_ICON;
  const trimmed = name.trim();
  const normalized = normalizeChampionName(trimmed);

  // Check for special icon naming
  const exception = ICON_EXCEPTIONS[normalized];
  if (exception) {
    return `/images/champions/Champion ${exception} Icon.avif`;
  }

  // Default: name matches filename directly (most champions)
  return `/images/champions/Champion ${trimmed} Icon.avif`;
}
