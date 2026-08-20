export const PLAYER_TAG_MINIMUM_COUNT = 5;

export function hasPlayerTag(count: unknown): boolean {
  const value = Number(count);
  return Number.isFinite(value) && value >= PLAYER_TAG_MINIMUM_COUNT;
}
