"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarClock, LockKeyhole, ShieldCheck } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import {
  fetchPrivateAccountDetail,
  type PrivateAccountDetail,
} from "@/lib/api-client";
import { TIER_NAMES, getRankIconPath, getTierColor } from "@/lib/tier-utils";

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

function tpDelta(value: number | null) {
  if (value == null) return null;
  return `${value > 0 ? "+" : ""}${value}`;
}

export default function PrivateAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const privateId = Number(params.id);
  const [detail, setDetail] = useState<PrivateAccountDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchPrivateAccountDetail(privateId)
      .then(result => {
        if (cancelled) return;
        setDetail(result);
        if (result.account.id !== privateId) router.replace(`/players/private-accounts/${result.account.id}`);
      })
      .catch(() => { if (!cancelled) setError("Private account details could not be loaded."); });
    return () => { cancelled = true; };
  }, [privateId, router]);

  if (error) {
    return <div className="mx-auto max-w-5xl rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>;
  }
  if (!detail) return <div className="mx-auto max-w-5xl"><LoadingPanel /></div>;

  const { account, observations } = detail;
  const tierName = TIER_NAMES[account.leagueTier] || "Unranked";
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href="/players/private-accounts" className="mb-2 inline-block text-xs text-pc-accent hover:underline">← Private accounts</Link>
        <div className="flex items-start gap-3">
          <LockKeyhole aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-slate-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted"><span>Private profile #{account.id}</span><span className="rounded border border-pc-border bg-pc-bg-elevated px-1.5 py-0.5 text-pc-text-secondary">Level {account.accountLevel.toLocaleString()}</span></div>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="pc-heading pc-heading-lg truncate text-pc-accent">{account.displayName}</h1>
              {account.verifiedName && <ShieldCheck aria-label="Verified from submitted evidence" className="h-5 w-5 shrink-0 text-emerald-300" />}
            </div>
            <p className="mt-1 text-sm text-pc-text-secondary">
              {account.verifiedName
                ? "Known name verified from submitted in-game evidence; the Hi-Rez profile remains private."
                : "Pseudonymous identity inferred conservatively from independent match observations."}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated sm:grid-cols-4 sm:divide-x sm:divide-pc-border">
        <div className="border-b border-pc-border p-4 sm:border-b-0"><div className="text-xs text-pc-text-muted">Latest mastery</div><div className="mt-1 text-xl font-semibold text-pc-text">{account.masteryLevel.toLocaleString()}</div></div>
        <div className="border-b border-l border-pc-border p-4 sm:border-b-0 sm:border-l-0"><div className="text-xs text-pc-text-muted">Latest rank</div><div className={`mt-1 flex items-center gap-2 font-semibold ${getTierColor(account.leagueTier)}`}><img src={getRankIconPath(account.leagueTier, 0)} alt="" className="h-8 w-8 shrink-0 object-contain" /><span className="truncate">{tierName}</span></div></div>
        <div className="p-4"><div className="text-xs text-pc-text-muted">Latest TP</div><div className="mt-1 text-xl font-semibold text-pc-text">{account.leaguePoints.toLocaleString()}</div></div>
        <div className="border-l border-pc-border p-4 sm:border-l-0"><div className="text-xs text-pc-text-muted">Tracked matches</div><div className="mt-1 text-xl font-semibold text-pc-text">{account.matchCount.toLocaleString()}</div></div>
      </section>

      <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4">
        <div className="flex flex-col gap-2 text-xs text-pc-text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Observed {observedAt(account.firstSeen)} – {observedAt(account.lastSeen)}</div>
          <div>Identity confidence {account.identityConfidence}% · {account.identityStatus}</div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-pc-text">Observed matches</h2>
        {observations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pc-border p-8 text-center text-sm text-pc-text-muted">No linked observations.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
            {observations.map(observation => (
              <Link
                key={`${observation.matchId}-${observation.privateSlot}`}
                href={`/matches/${observation.matchId}`}
                className="grid gap-2 border-b border-pc-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-pc-bg/50 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-pc-text">{observation.map || `Match #${observation.matchId}`}</div>
                  <div className="mt-0.5 truncate text-xs text-pc-text-muted">{observation.championName || "Unknown champion"} · {observation.region || "Unknown region"} · {observedAt(observation.entryDatetime)}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-pc-text-secondary"><img src={getRankIconPath(observation.leagueTier, 0)} alt="" className="h-6 w-6 object-contain" /><span>{TIER_NAMES[observation.leagueTier] || "Unranked"}</span></div>
                <div className="text-xs text-pc-text-secondary"><span className="font-semibold text-pc-text">{observation.leaguePoints} TP</span>{observation.tpDelta != null && <span className={`ml-1 ${observation.tpDelta > 0 ? "text-emerald-300" : observation.tpDelta < 0 ? "text-red-300" : "text-pc-text-muted"}`}>({tpDelta(observation.tpDelta)})</span>}<div className="mt-0.5 text-[10px] uppercase tracking-wide text-pc-text-muted">{observation.winStatus || "Result unknown"} · Level {observation.accountLevel} · Mastery {observation.masteryLevel}</div></div>
                <div className="text-right text-xs text-pc-text-muted">{duration(observation.durationSeconds)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
