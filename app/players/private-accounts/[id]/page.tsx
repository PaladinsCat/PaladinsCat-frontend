"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarClock, LockKeyhole, Menu, ShieldCheck } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import {
  fetchPrivateAccountDetail,
  reportPrivateAccount,
  type ReportType,
  type PrivateAccountDetail,
} from "@/lib/api-client";
import { TIER_NAMES, getRankIconPath, getTierColor } from "@/lib/tier-utils";
import { useLocalization } from "@/lib/localization-context";
import { PlayerModerationTag } from "@/components/player-name";
import ReportModal from "@/components/ReportModal";
import { useAuth } from "@/lib/auth-context";

function duration(seconds: number) {
  if (!seconds) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function tpDelta(value: number | null) {
  if (value == null) return null;
  return `${value > 0 ? "+" : ""}${value}`;
}

export default function PrivateAccountDetailPage() {
  const { t, formatDateTime, formatNumber } = useLocalization();
  const { isAdmin, isApproved } = useAuth();
  const observedAt = formatDateTime;
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const privateId = Number(params.id);
  const [detail, setDetail] = useState<PrivateAccountDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [reportType, setReportType] = useState<Extract<ReportType, "suspicious" | "cheater"> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchPrivateAccountDetail(privateId)
      .then(result => {
        if (cancelled) return;
        setDetail(result);
        if (result.account.id !== privateId) router.replace(`/players/private-accounts/${result.account.id}`);
      })
      .catch(() => { if (!cancelled) setError(t("generated.players.privateAccountDetailsCouldNotBeLoaded")); });
    return () => { cancelled = true; };
  }, [privateId, reloadKey, router]);

  if (error) {
    return <div className="mx-auto max-w-5xl rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>;
  }
  if (!detail) return <div className="mx-auto max-w-5xl"><LoadingPanel /></div>;

  const { account, observations } = detail;
  const tierName = TIER_NAMES[account.leagueTier] || "Unranked";
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href="/players/private-accounts" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.privateAccounts.a28b00d")}</Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
          <LockKeyhole aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-slate-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-pc-text-muted"><span>{t("generated.players.privateProfile")}{account.id}</span><span className="rounded border border-pc-border bg-pc-bg-elevated px-1.5 py-0.5 text-pc-text-secondary">{t("generated.players.level")}{" "}{formatNumber(account.accountLevel)}</span></div>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="pc-heading pc-heading-lg truncate text-pc-accent">{account.displayName}</h1>
              <PlayerModerationTag playerId={0} cheater={account.cheater} susCount={account.susCount} verified={false} />
              {account.verifiedName && <ShieldCheck aria-label={t("generated.players.verifiedFromSubmittedEvidence")} className="h-5 w-5 shrink-0 text-emerald-300" />}
            </div>
            <p className="mt-1 text-sm text-pc-text-secondary">
              {account.verifiedName
                ? t("generated.players.knownNameVerifiedFromSubmittedInGameEvidenceTheHi")
                : t("generated.players.pseudonymousIdentityInferredConservativelyFromIndependentMatchObservations")}
            </p>
          </div>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setActionMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-sm font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent"
              aria-haspopup="menu"
              aria-expanded={actionMenuOpen}
            >
              <Menu aria-hidden="true" className="h-4 w-4" />
              {t("generated.players.actions")}
            </button>
            {actionMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary p-2 shadow-lg" role="menu">
                <div className="px-2 pb-1 pt-1 text-xs font-bold uppercase tracking-widest text-pc-text-muted">{t("generated.players.community")}</div>
                <button type="button" role="menuitem" onClick={() => { setActionMenuOpen(false); setReportType("suspicious"); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-amber-400 transition-colors hover:bg-amber-500/10">
                  <span>{t("generated.players.reportSuspicious")}</span>
                  {account.susCount > 0 && <span className="text-xs tabular-nums">{formatNumber(account.susCount)}</span>}
                </button>
                {(isAdmin || isApproved) && (
                  <>
                    <div className="my-2 border-t border-pc-border/70" />
                    <div className="px-2 pb-1 text-xs font-bold uppercase tracking-widest text-pc-text-muted">{t("generated.players.moderation")}</div>
                    <button type="button" role="menuitem" onClick={() => { setActionMenuOpen(false); setReportType("cheater"); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10">
                      {t("generated.players.flagAsCheater")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated sm:grid-cols-4 sm:divide-x sm:divide-pc-border">
        <div className="border-b border-pc-border p-4 sm:border-b-0"><div className="text-xs text-pc-text-muted">{t("generated.players.latestMastery")}</div><div className="mt-1 text-xl font-semibold text-pc-text">{formatNumber(account.masteryLevel)}</div></div>
        <div className="border-b border-l border-pc-border p-4 sm:border-b-0 sm:border-l-0"><div className="text-xs text-pc-text-muted">{t("generated.players.latestRank")}</div><div className={`mt-1 flex items-center gap-2 font-semibold ${getTierColor(account.leagueTier)}`}><img src={getRankIconPath(account.leagueTier, 0)} alt="" className="h-8 w-8 shrink-0 object-contain" /><span className="truncate">{tierName}</span></div></div>
        <div className="p-4"><div className="text-xs text-pc-text-muted">{t("generated.players.latestTp")}</div><div className="mt-1 text-xl font-semibold text-pc-text">{formatNumber(account.leaguePoints)}</div></div>
        <div className="border-l border-pc-border p-4 sm:border-l-0"><div className="text-xs text-pc-text-muted">{t("generated.players.trackedMatches")}</div><div className="mt-1 text-xl font-semibold text-pc-text">{formatNumber(account.matchCount)}</div></div>
      </section>

      <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4">
        <div className="flex flex-col gap-2 text-xs text-pc-text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />{t("generated.players.observed")}{" "}{observedAt(account.firstSeen)} – {observedAt(account.lastSeen)}</div>
          <div>{t("generated.players.identityConfidence")}{" "}{account.identityConfidence}% · {account.identityStatus}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-pc-text">{t("generated.players.observedMatches")}</h2>
        {observations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pc-border p-8 text-center text-sm text-pc-text-muted">{t("generated.players.noLinkedObservations")}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
            {observations.map(observation => (
              <Link
                key={`${observation.matchId}-${observation.privateSlot}`}
                href={`/matches/${observation.matchId}`}
                className="grid gap-2 border-b border-pc-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-pc-bg/50 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-pc-text">{observation.map || t("generated.players.matchValue1", { value1: observation.matchId })}</div>
                  <div className="mt-0.5 truncate text-xs text-pc-text-muted">{observation.championName || t("generated.players.unknownChampion")} · {observation.region || t("generated.players.unknownRegion")} · {observedAt(observation.entryDatetime)}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-pc-text-secondary"><img src={getRankIconPath(observation.leagueTier, 0)} alt="" className="h-6 w-6 object-contain" /><span>{TIER_NAMES[observation.leagueTier] || t("generated.players.unranked")}</span></div>
                <div className="text-xs text-pc-text-secondary"><span className="font-semibold text-pc-text">{observation.leaguePoints} {t("generated.players.tp")}</span>{observation.tpDelta != null && <span className={`ml-1 ${observation.tpDelta > 0 ? "text-emerald-300" : observation.tpDelta < 0 ? "text-red-300" : "text-pc-text-muted"}`}>({tpDelta(observation.tpDelta)})</span>}<div className="mt-0.5 text-xs uppercase tracking-wide text-pc-text-muted">{observation.winStatus || t("generated.players.resultUnknown")} {t("generated.players.level.1019695")}{" "}{observation.accountLevel} {t("generated.players.mastery.5f14f16")}{" "}{observation.masteryLevel}</div></div>
                <div className="text-right text-xs text-pc-text-muted">{duration(observation.durationSeconds)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
      {reportType && (
        <ReportModal
          playerId={privateId}
          type={reportType}
          submitReport={reportPrivateAccount}
          onClose={() => setReportType(null)}
          onSuccess={() => { setReportType(null); setReloadKey((key) => key + 1); }}
        />
      )}
    </div>
  );
}
