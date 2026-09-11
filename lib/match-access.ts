/** Own the frontend projection of the backend match-access tier. */

export type MatchAccessTier = "guest" | "account" | "verified";

export function matchDetailSections(tier: MatchAccessTier) {
  return {
    loadouts: tier !== "guest",
    fullDetails: tier === "verified",
  };
}
