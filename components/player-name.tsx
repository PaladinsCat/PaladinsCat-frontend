"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchPlayerModeration, mergePlayerModeration, type PlayerModeration } from "@/lib/player-moderation";
import { useLocalization } from "@/lib/localization-context";

const EMPTY_MODERATION: PlayerModeration = {
  cheater: false,
  susCount: 0,
  dropper: false,
  afkWintrade: false,
  boosted: false,
  altAccount: false,
  verified: false,
};

export function VerifiedPlayerBadge({ className = "", iconClassName = "h-3.5 w-3.5" }: { className?: string; iconClassName?: string }) {
  const { t } = useLocalization();
  return (
    <span className={`inline-flex shrink-0 ${className}`} role="img" aria-label={t("generated.players.verifiedPaladinscatPlayer")} title={t("generated.players.verifiedPaladinscatPlayer")}>
      {/* html-to-image embeds <img src>, but leaves a <picture><source srcset>
          external inside its cloned SVG. Keep the small transparent PNG as a
          direct image so on-page and exported scoreboards render identically. */}
      <img src="/images/icons/Verified_Player_Support_Icon.avif" alt="" className={`verified-player-icon ${iconClassName} object-contain`} />
    </span>
  );
}

export function PlayerModerationTag({
  playerId,
  cheater,
  susCount,
  dropper,
  afkWintrade,
  automaticAfk,
  wallShooter,
  masterFeeding,
  automaticTag,
  boosted,
  altAccount,
  verified,
}: {
  playerId: string | number;
  cheater?: boolean;
  susCount?: number;
  dropper?: boolean;
  afkWintrade?: boolean;
  automaticAfk?: boolean;
  wallShooter?: boolean;
  masterFeeding?: boolean;
  automaticTag?: "TANK" | "SUP" | "DPS" | "FLANK" | "NOOB" | "CARRY";
  boosted?: boolean;
  altAccount?: boolean;
  verified?: boolean;
}) {
  const { t } = useLocalization();
  const hasCompleteState = cheater !== undefined
    && susCount !== undefined
    && dropper !== undefined
    && afkWintrade !== undefined
    && boosted !== undefined
    && altAccount !== undefined
    && verified !== undefined;
  const suppliedModeration = { cheater, susCount, dropper, afkWintrade, boosted, altAccount, verified };
  const [moderation, setModeration] = useState<PlayerModeration>(() => (
    mergePlayerModeration(EMPTY_MODERATION, suppliedModeration)
  ));

  useEffect(() => {
    if (hasCompleteState) {
      setModeration(mergePlayerModeration(EMPTY_MODERATION, suppliedModeration));
      return;
    }
    // Preserve every moderation field supplied by the owning data surface.
    // Some callers know the canonical cheater/suspicious values but still need
    // the stored-account verification bit. The older all-or-nothing merge let
    // the secondary bulk request overwrite those supplied values, which made a
    // match row banner and its CHEATER tag disagree while their caches expired.
    setModeration(mergePlayerModeration(EMPTY_MODERATION, suppliedModeration));
    let active = true;
    fetchPlayerModeration(playerId).then((state) => {
      if (active) {
        setModeration(mergePlayerModeration(state, suppliedModeration));
      }
    });
    return () => { active = false; };
  }, [afkWintrade, altAccount, boosted, cheater, dropper, hasCompleteState, playerId, susCount, verified]);

  return <span className="inline-flex max-h-10 min-w-0 flex-wrap items-center gap-1 overflow-hidden">
    {moderation.verified && <VerifiedPlayerBadge />}
    {moderation.cheater && <span className="player-status-tag cheater shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-400" aria-label={t("generated.players.confirmedCheater")}>{t("generated.players.cheater")}</span>}
    {!moderation.cheater && <>
      {moderation.dropper && <span className="player-status-tag dropper shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-rose-300">{t("moderation.dropShort")}</span>}
      {moderation.susCount > 0 && <span className="player-status-tag suspicious shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-400" aria-label={t("generated.players.suspiciousPlayerWithValue1Flags", { value1: moderation.susCount })}>{t("generated.players.sus")}</span>}
      {(moderation.afkWintrade || automaticAfk) && <span className={`player-status-tag afk shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold leading-none ${automaticAfk ? moderation.afkWintrade ? "border-red-400/30 bg-red-400/10 text-sky-300" : "border-red-400/30 bg-red-400/10 text-red-300" : "border-sky-400/30 bg-sky-400/10 text-sky-300"}`}>{t("moderation.afkShort")}</span>}
      {wallShooter && <span className="player-status-tag wall-shooter shrink-0 rounded border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-cyan-200">{t("moderation.wallShort")}</span>}
      {masterFeeding && <span className="player-status-tag master-feeding shrink-0 rounded border border-rose-400/30 bg-rose-400/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-rose-200">{t("moderation.feedShort")}</span>}
      {automaticTag && <span className="player-status-tag performance-diff shrink-0 rounded border border-indigo-400/30 bg-indigo-400/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-indigo-100">{automaticTag}</span>}
      {moderation.boosted && <span className="player-status-tag boosted shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-orange-300">{t("moderation.boostedShort")}</span>}
      {moderation.altAccount && <span className="player-status-tag alt shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-violet-300">{t("moderation.altShort")}</span>}
    </>}
  </span>;
}

/** A player name with its confirmed-cheater or suspicious-player label. */
export default function PlayerName({
  playerId,
  children,
  cheater,
  susCount,
  dropper,
  afkWintrade,
  automaticAfk,
  wallShooter,
  masterFeeding,
  automaticTag,
  boosted,
  altAccount,
  verified,
  className = "",
}: {
  playerId: string | number;
  children: ReactNode;
  cheater?: boolean;
  susCount?: number;
  dropper?: boolean;
  afkWintrade?: boolean;
  automaticAfk?: boolean;
  wallShooter?: boolean;
  masterFeeding?: boolean;
  automaticTag?: "TANK" | "SUP" | "DPS" | "FLANK" | "NOOB" | "CARRY";
  boosted?: boolean;
  altAccount?: boolean;
  verified?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex max-h-10 max-w-full min-w-0 flex-wrap items-center gap-1 overflow-hidden align-middle ${className}`}>
      <span className="min-w-0 truncate">{children}</span>
      <PlayerModerationTag playerId={playerId} cheater={cheater} susCount={susCount} dropper={dropper} afkWintrade={afkWintrade} automaticAfk={automaticAfk} wallShooter={wallShooter} masterFeeding={masterFeeding} automaticTag={automaticTag} boosted={boosted} altAccount={altAccount} verified={verified} />
    </span>
  );
}
