"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarClock, Users } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import {
  fetchBoostedPlayerDetail,
  type BoostedPlayerDetail,
} from "@/lib/api-client";
import { TIER_NAMES, getRankIconPath, getTierColor } from "@/lib/tier-utils";
import { useLocalization } from "@/lib/localization-context";

function observedAt(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function duration(seconds: number) {
  if (!seconds) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function resultColor(result: string | null) {
  const normalized = result?.toLowerCase();
  if (normalized === "winner" || normalized === "win") return "text-emerald-300";
  if (normalized === "loser" || normalized === "loss") return "text-red-300";
  return "text-pc-text-muted";
}

export default function BoostedPlayerDetailPage() {
  const { t } = useLocalization();
  const params = useParams<{ id: string }>();
  const playerId = params.id;
  const [detail, setDetail] = useState<BoostedPlayerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError(null);
    fetchBoostedPlayerDetail(playerId)
      .then((result) => { if (!cancelled) setDetail(result); })
      .catch(() => { if (!cancelled) setError(t("generated.players.playerProfileUnavailable")); });
    return () => { cancelled = true; };
  }, [playerId]);

  if (error) {
    return <div className="mx-auto max-w-5xl rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>;
  }
  if (!detail) return <div className="mx-auto max-w-5xl"><LoadingPanel /></div>;

  const { player, matches } = detail;
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href="/players/boosted" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("moderation.boostedPlayers")}</Link>
        <div className="flex items-start gap-3">
          <Users aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-orange-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">
              <span className="rounded border border-orange-400/30 bg-orange-400/15 px-1.5 py-0.5 text-orange-300">{t("moderation.boosted")}</span>
              <span>{player.platform}</span>
              <span>{player.region}</span>
            </div>
            <h1 className="pc-heading pc-heading-lg truncate text-pc-accent">{player.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-pc-text-secondary">{t("moderation.boostedDescription")}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated sm:grid-cols-4 sm:divide-x sm:divide-pc-border">
        <div className="border-b border-pc-border p-4 sm:border-b-0"><div className="text-xs text-pc-text-muted">{t("generated.players.trackedMatches")}</div><div className="mt-1 text-xl font-semibold text-pc-text">{matches.length.toLocaleString()}</div></div>
        <div className="border-b border-l border-pc-border p-4 sm:border-b-0 sm:border-l-0"><div className="text-xs text-pc-text-muted">{t("moderation.cheaterDuo")}</div><div className="mt-1 text-xl font-semibold text-pc-text">{player.cheaters.length.toLocaleString()}</div></div>
        <div className="p-4"><div className="text-xs text-pc-text-muted">{t("generated.players.firstObserved")}</div><div className="mt-1 text-sm font-semibold text-pc-text">{observedAt(player.firstSeen)}</div></div>
        <div className="border-l border-pc-border p-4 sm:border-l-0"><div className="text-xs text-pc-text-muted">{t("generated.players.lastObserved")}</div><div className="mt-1 text-sm font-semibold text-pc-text">{observedAt(player.lastSeen)}</div></div>
      </section>

      <section className="rounded-xl border border-orange-400/20 bg-pc-bg-elevated p-4">
        <h2 className="mb-3 text-sm font-semibold text-pc-text">{t("moderation.cheaterDuo")}</h2>
        <div className="flex flex-wrap gap-2">
          {player.cheaters.map((cheater) => (
            <Link key={cheater.id} href={`/players/${cheater.id}`} className="rounded-md border border-red-500/20 bg-[#161618] px-2.5 py-2 text-xs text-red-200 transition-colors hover:border-red-400/40 hover:text-white">
              <span className="font-semibold">{cheater.name}</span>
              <span className="ml-1 text-red-200/70">· {cheater.matchCount.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-pc-text">{t("generated.players.observedMatches")}</h2>
        {matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pc-border p-8 text-center text-sm text-pc-text-muted">{t("generated.players.noLinkedObservations")}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
            {matches.map((match) => (
              <Link
                key={match.matchId}
                href={`/matches/${match.matchId}`}
                className="grid gap-2 border-b border-pc-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-pc-bg/50 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-pc-text">{match.map || t("generated.players.matchValue1", { value1: match.matchId })}</div>
                  <div className="mt-0.5 truncate text-xs text-pc-text-muted">{match.championName || t("generated.players.unknownChampion")} · {match.region || t("generated.players.unknownRegion")} · {observedAt(match.entryDatetime)}</div>
                  <div className="mt-1 flex min-w-0 flex-wrap gap-1">
                    {match.cheaters.map((cheater) => <span key={cheater.id} className="truncate rounded border border-red-500/20 bg-[#161618] px-1.5 py-0.5 text-[10px] font-semibold text-red-200">{cheater.name}</span>)}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${getTierColor(match.leagueTier)}`}><img src={getRankIconPath(match.leagueTier, 0)} alt="" className="h-6 w-6 object-contain" /><span>{TIER_NAMES[match.leagueTier] || t("generated.players.unranked")}</span></div>
                <div className="text-xs text-pc-text-secondary"><span className={`font-semibold ${resultColor(match.winStatus)}`}>{match.winStatus || t("generated.players.resultUnknown")}</span><div className="mt-0.5 tabular-nums text-pc-text-muted">{match.kills} / {match.deaths} / {match.assists}</div></div>
                <div className="text-right text-xs text-pc-text-muted">{duration(match.durationSeconds)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4">
        <div className="flex items-center gap-2 text-xs text-pc-text-muted"><CalendarClock className="h-4 w-4" />{t("generated.players.firstObserved")} {observedAt(player.firstSeen)} · {t("generated.players.lastObserved")} {observedAt(player.lastSeen)}</div>
      </section>
    </div>
  );
}
