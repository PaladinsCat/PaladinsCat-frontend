/** Classifies player tags using verified threshold rules.
 * The module owns the existing validation, policy, label, title, or preference behavior.
 * refs: none
 */
/**
 * Require five observations before showing a count-based player tag.
 * refs: none
 */
export const PLAYER_TAG_MINIMUM_COUNT = 5;

/**
 * Coerce the count to a number and return true only when it is finite and at least PLAYER_TAG_MINIMUM_COUNT (five).
 * refs: none
 * I/O types: `count: unknown -> boolean`.
 */
export function hasPlayerTag(count: unknown): boolean {
  const value = Number(count);
  return Number.isFinite(value) && value >= PLAYER_TAG_MINIMUM_COUNT;
}
