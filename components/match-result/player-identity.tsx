"use client";

import Link from "next/link";
import PlayerName from "@/components/player-name";
import type { MatchPlayerDetail } from "@/lib/api-client";

export function trackedPrivateId(player: MatchPlayerDetail): number | null {
  const privateId = Number(player.private_player_id ?? 0);
  return Number(player.player_id) === 0 && Number.isInteger(privateId) && privateId > 0 ? privateId : null;
}

export function matchPlayerKey(player: MatchPlayerDetail): string {
  const privateId = trackedPrivateId(player);
  if (privateId) return `private:${privateId}:${Number(player.private_slot ?? 0)}`;
  return `player:${Number(player.player_id)}:${Number(player.private_slot ?? 0)}`;
}

export function matchPlayerHref(player: MatchPlayerDetail): string | null {
  const privateId = trackedPrivateId(player);
  if (privateId) return `/players/private-accounts/${privateId}`;
  const playerId = Number(player.player_id);
  return playerId > 0 ? `/players/${playerId}` : null;
}

export function MatchPlayerLink({ player, className = "" }: { player: MatchPlayerDetail; className?: string }) {
  const privateId = trackedPrivateId(player);
  const href = matchPlayerHref(player);
  const content = privateId ? (
    <>
      <span>Private Account</span>
      <span className="ml-1 inline-flex rounded border border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5 align-middle text-[0.68em] font-bold uppercase tracking-wide text-violet-200">#{privateId}</span>
    </>
  ) : Number(player.player_id) === 0 ? (
    <span>Private Account</span>
  ) : (
    <PlayerName playerId={player.player_id}>{player.player_name || "Unknown"}</PlayerName>
  );

  return href ? <Link href={href} className={className} title={privateId ? `Private account #${privateId}` : player.player_name}>{content}</Link> : <span className={className}>{content}</span>;
}

export function MatchPlayerReference({ player, className = "" }: { player: MatchPlayerDetail; className?: string }) {
  const privateId = trackedPrivateId(player);
  if (privateId) {
    return <Link href={`/players/private-accounts/${privateId}`} className={className}>Private ID {privateId}</Link>;
  }
  if (Number(player.player_id) === 0) return <span className={className}>Private ID unavailable</span>;
  return <span className={className}>PID {player.player_id}</span>;
}
