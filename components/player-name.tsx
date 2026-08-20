"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchPlayerModeration, mergePlayerModeration, type PlayerModeration } from "@/lib/player-moderation";
import { useLocalization } from "@/lib/localization-context";
import { hasPlayerTag } from "@/lib/player-tag-threshold";

const EMPTY_MODERATION: PlayerModeration = {
  cheater: false,
  susCount: 0,
  dropper: false,
  dropperVoteCount: 0,
  afkWintrade: false,
  afkWintradeVoteCount: 0,
  boosted: false,
  boostedMatchCount: 0,
  altAccount: false,
  altAccountVoteCount: 0,
  automaticAfkCount: 0,
  wallShooterCount: 0,
  masterFeedingCount: 0,
  tankDiffCount: 0,
  supportDiffCount: 0,
  dpsDiffCount: 0,
  flankDiffCount: 0,
  noobCount: 0,
  hypercarryCount: 0,
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

export type PlayerModerationTagProps = {
  playerId: string | number;
  cheater?: boolean;
  susCount?: number;
  dropper?: boolean;
  dropperVoteCount?: number;
  afkWintrade?: boolean;
  afkWintradeVoteCount?: number;
  automaticAfk?: boolean;
  automaticAfkCount?: number;
  wallShooter?: boolean;
  wallShooterCount?: number;
  masterFeeding?: boolean;
  masterFeedingCount?: number;
  automaticTag?: "TANK" | "SUP" | "DPS" | "FLANK" | "NOOB" | "CARRY";
  boosted?: boolean;
  boostedMatchCount?: number;
  altAccount?: boolean;
  altAccountVoteCount?: number;
  verified?: boolean;
};

export function PlayerModerationTag({
  playerId,
  cheater,
  susCount,
  dropper,
  dropperVoteCount,
  afkWintrade,
  afkWintradeVoteCount,
  automaticAfk,
  automaticAfkCount,
  wallShooter,
  wallShooterCount,
  masterFeeding,
  masterFeedingCount,
  automaticTag,
  boosted,
  boostedMatchCount,
  altAccount,
  altAccountVoteCount,
  verified,
}: PlayerModerationTagProps) {
  const { t } = useLocalization();
  const suppliedModeration = {
    cheater,
    susCount,
    dropper,
    dropperVoteCount,
    afkWintrade,
    afkWintradeVoteCount,
    automaticAfkCount,
    wallShooterCount,
    masterFeedingCount,
    boosted,
    boostedMatchCount,
    altAccount,
    altAccountVoteCount,
    verified,
  };
  const [moderation, setModeration] = useState<PlayerModeration>(() => (
    mergePlayerModeration(EMPTY_MODERATION, suppliedModeration)
  ));

  useEffect(() => {
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
  }, [afkWintrade, afkWintradeVoteCount, altAccount, altAccountVoteCount, automaticAfkCount, boosted, boostedMatchCount, cheater, dropper, dropperVoteCount, masterFeedingCount, playerId, susCount, verified, wallShooterCount]);

  const communityAfk = moderation.afkWintrade && hasPlayerTag(moderation.afkWintradeVoteCount);
  const automaticAfkTagged = Boolean(automaticAfk) || hasPlayerTag(moderation.automaticAfkCount);
  const automaticTags = ([
    ["TANK", moderation.tankDiffCount],
    ["SUP", moderation.supportDiffCount],
    ["DPS", moderation.dpsDiffCount],
    ["FLANK", moderation.flankDiffCount],
    ["NOOB", moderation.noobCount],
    ["CARRY", moderation.hypercarryCount],
  ] as const).filter(([, count]) => hasPlayerTag(count)).map(([tag]) => tag);
  if (automaticTag && !automaticTags.includes(automaticTag)) automaticTags.push(automaticTag);

  return <span className="inline-flex max-h-10 min-w-0 flex-wrap items-center gap-1 overflow-hidden">
    {moderation.verified && <VerifiedPlayerBadge />}
    {moderation.cheater && <span className="player-status-tag cheater shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-400" aria-label={t("generated.players.confirmedCheater")}>{t("generated.players.cheater")}</span>}
    {!moderation.cheater && <>
      {moderation.dropper && hasPlayerTag(moderation.dropperVoteCount) && <span className="player-status-tag dropper shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-rose-300">{t("moderation.dropShort")}</span>}
      {hasPlayerTag(moderation.susCount) && <span className="player-status-tag suspicious shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-400" aria-label={t("generated.players.suspiciousPlayerWithValue1Flags", { value1: moderation.susCount })}>{t("generated.players.sus")}</span>}
      {(communityAfk || automaticAfkTagged) && <span className={`player-status-tag afk shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold leading-none ${automaticAfkTagged ? communityAfk ? "border-red-400/30 bg-red-400/10 text-sky-300" : "border-red-400/30 bg-red-400/10 text-red-300" : "border-sky-400/30 bg-sky-400/10 text-sky-300"}`}>{t("moderation.afkShort")}</span>}
      {(wallShooter || hasPlayerTag(moderation.wallShooterCount)) && <span className="player-status-tag wall-shooter shrink-0 rounded border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-cyan-200">{t("moderation.wallShort")}</span>}
      {(masterFeeding || hasPlayerTag(moderation.masterFeedingCount)) && <span className="player-status-tag master-feeding shrink-0 rounded border border-rose-400/30 bg-rose-400/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-rose-200">{t("moderation.feedShort")}</span>}
      {automaticTags.map((tag) => <span key={tag} className="player-status-tag performance-diff shrink-0 rounded border border-indigo-400/30 bg-indigo-400/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-indigo-100">{tag}</span>)}
      {moderation.boosted && hasPlayerTag(moderation.boostedMatchCount) && <span className="player-status-tag boosted shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-orange-300">{t("moderation.boostedShort")}</span>}
      {moderation.altAccount && hasPlayerTag(moderation.altAccountVoteCount) && <span className="player-status-tag alt shrink-0 rounded bg-[var(--pc-bg-secondary)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-violet-300">{t("moderation.altShort")}</span>}
    </>}
  </span>;
}

/** A player name with its confirmed-cheater or suspicious-player label. */
export default function PlayerName({
  playerId,
  children,
  className = "",
  ...moderation
}: PlayerModerationTagProps & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex max-h-10 max-w-full min-w-0 flex-wrap items-center gap-1 overflow-hidden align-middle ${className}`}>
      <span className="min-w-0 truncate">{children}</span>
      <PlayerModerationTag playerId={playerId} {...moderation} />
    </span>
  );
}
