// Champion icon paths — auto-resolved from public/images/champions/
// Pattern: /images/champions/Champion {Name} Icon.avif
// Generic fallback for champions without icons

const GENERIC_ICON = "/images/champions/Champion_Generic_Icon.avif";

/**
 * Return the generic champion icon path.
 */
export function getGenericChampionIcon(): string {
  return GENERIC_ICON;
}

/**
 * Get the icon path for a champion, automatically falling back to generic.
 * All real Paladins champions have icon files. This always returns the correct path.
 */
export function getChampionIconSafe(name: string): string {
  // Real champion icons are named "Champion {Name} Icon.avif"
  const path = `/images/champions/Champion ${name} Icon.avif`;
  return path;
}
