/**
 * Renders party badge data for match-result views.
 * Keeps the component's interaction and accessibility behavior intact.
 * refs: none
 */
"use client";

import { Users } from "lucide-react";
import type { MatchPlayerDetail } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

type PartyPlayer = Pick<MatchPlayerDetail, "party" | "party_number">;

/** Render getPartyNumber from its declared props and match data.
 * Contract: consumes the declared props, preserves event and accessibility behavior, and returns the corresponding UI element.
 * Returns: `number | null`
 * refs: none
 */
export function getPartyNumber(player: PartyPlayer): number | null {
  const value = Number(player.party ?? player.party_number ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
}

/** Render PartyBadge from its declared props and match data.
 * Contract: consumes the declared props, preserves event and accessibility behavior, and returns the corresponding UI element.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PartyBadge({
  player,
  className = "",
}: {
  player: PartyPlayer;
  className?: string;
}) {
  const { t } = useLocalization();
  const partyNumber = getPartyNumber(player);
  if (partyNumber == null) return null;

  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-pc-accent/30 bg-pc-accent/10 px-1.5 text-[10px] font-bold tabular-nums text-pc-accent ${className}`}
      title={t("common.party.queuedTogether", { number: partyNumber })}
      aria-label={t("common.party.label", { number: partyNumber })}
    >
      <Users aria-hidden="true" className="h-3 w-3" strokeWidth={2.25} />
      {partyNumber}
    </span>
  );
}
