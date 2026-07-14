"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchPlayerModeration, type PlayerModeration } from "@/lib/player-moderation";

const EMPTY_MODERATION: PlayerModeration = { cheater: false, susCount: 0, verified: false };

export function VerifiedPlayerBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 ${className}`} role="img" aria-label="Verified PaladinsCat player" title="Verified PaladinsCat player">
      <picture>
        <source srcSet="/images/icons/Verified_Player_Support_Icon.avif" type="image/avif" />
        <img src="/images/icons/Verified_Player_Support_Icon.png" alt="" className="h-3.5 w-3.5 object-contain" />
      </picture>
    </span>
  );
}

export function PlayerModerationTag({
  playerId,
  cheater,
  susCount,
  verified,
}: {
  playerId: string | number;
  cheater?: boolean;
  susCount?: number;
  verified?: boolean;
}) {
  const hasInitialState = cheater !== undefined && susCount !== undefined && verified !== undefined;
  const [moderation, setModeration] = useState<PlayerModeration>(() => (
    hasInitialState
      ? { cheater: Boolean(cheater), susCount: Number(susCount) || 0, verified: Boolean(verified) }
      : EMPTY_MODERATION
  ));

  useEffect(() => {
    if (hasInitialState) {
      setModeration({ cheater: Boolean(cheater), susCount: Number(susCount) || 0, verified: Boolean(verified) });
      return;
    }
    let active = true;
    fetchPlayerModeration(playerId).then((state) => {
      if (active) setModeration(state);
    });
    return () => { active = false; };
  }, [cheater, hasInitialState, playerId, susCount, verified]);

  return <>
    {moderation.verified && <VerifiedPlayerBadge />}
    {moderation.cheater && <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-400" aria-label="Confirmed cheater">CHEATER</span>}
    {!moderation.cheater && moderation.susCount > 0 && <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-400" aria-label={`Suspicious player with ${moderation.susCount} flags`}>SUS</span>}
  </>;
}

/** A player name with its confirmed-cheater or suspicious-player label. */
export default function PlayerName({
  playerId,
  children,
  cheater,
  susCount,
  verified,
  className = "",
}: {
  playerId: string | number;
  children: ReactNode;
  cheater?: boolean;
  susCount?: number;
  verified?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1 align-middle ${className}`}>
      <span className="truncate">{children}</span>
      <PlayerModerationTag playerId={playerId} cheater={cheater} susCount={susCount} verified={verified} />
    </span>
  );
}
