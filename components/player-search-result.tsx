/** player-search-result component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
import type { UniversalSearchResult } from "@/lib/api-client";
import { getRankIconPath, getTierColor, resolveEffectiveTier } from "@/lib/tier-utils";

/**
 * Render the player metadata used by universal search with the same rank
 * naming and iconography as the player profile header.
 * Returns: `React.JSX.Element`
 */
export function PlayerSearchSubtitle({ result }: { result: UniversalSearchResult }) {
  if (result.type !== "player") return <>{result.subtitle}</>;

  const rawTier = result.meta?.tier;
  const tier = Number(rawTier);
  if (rawTier == null || !Number.isFinite(tier)) return <>{result.subtitle}</>;

  const rank = Number(result.meta?.rank ?? 0);
  const effectiveTier = resolveEffectiveTier(tier, Number.isFinite(rank) ? rank : 0);
  const rankIcon = getRankIconPath(tier, Number.isFinite(rank) ? rank : 0);
  const tierColor = getTierColor(effectiveTier.displayTier);
  const parts = result.subtitle.split(" · ");
  const tierPartIndex = parts.findIndex((part) => /^Tier\s+\d+$/i.test(part));

  // Keep compatibility with cached/remote results that may not carry the
  // legacy "Tier N" segment in their subtitle.
  if (tierPartIndex < 0) {
    return (
      <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
        <span className="truncate">{result.subtitle}</span>
        <span className={`inline-flex shrink-0 items-center gap-1 font-semibold ${tierColor}`}>
          <img src={rankIcon} alt={effectiveTier.displayName} className="h-4 w-4 object-contain" loading="lazy" />
          {effectiveTier.displayName}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-1">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 && <span className="text-pc-border">·</span>}
          {index === tierPartIndex ? (
            <span className={`inline-flex items-center gap-1 font-semibold ${tierColor}`}>
              <img src={rankIcon} alt={effectiveTier.displayName} className="h-4 w-4 object-contain" loading="lazy" />
              {effectiveTier.displayName}
            </span>
          ) : part}
        </span>
      ))}
    </span>
  );
}
