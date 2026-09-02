/** Classifies player tags using verified threshold rules.
 * The module owns the existing validation, policy, label, title, or preference behavior.
 * refs: none
 */
/** Apply PLAYER_TAG_MINIMUM_COUNT to the declared player or request input.
 * Contract: enforces the module rule and returns the documented value without changing unrelated state.
 * refs: none
 */
export const PLAYER_TAG_MINIMUM_COUNT = 5;

/** Apply hasPlayerTag to the declared player or request input.
 * Contract: enforces the module rule and returns the documented value without changing unrelated state.
 * refs: none
 */
export function hasPlayerTag(count: unknown): boolean {
  const value = Number(count);
  return Number.isFinite(value) && value >= PLAYER_TAG_MINIMUM_COUNT;
}
