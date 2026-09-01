/** Shared responsive match-list surface used by match and evidence directories. */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { MatchSearchResult } from "@/lib/api-client";
import { formatLocalDateTime } from "@/lib/time-format";
import { useLocalization } from "@/lib/localization-context";

export default function MatchDirectoryList({
  matches,
  mobileFooter,
  desktopFooter,
}: {
  matches: MatchSearchResult[];
  mobileFooter?: ReactNode;
  desktopFooter?: ReactNode;
}) {
  const { t } = useLocalization();
  return <>
    <div className="space-y-2 sm:hidden">
      {matches.map((match) => <MatchCard key={match.match_id} match={match} />)}
      {mobileFooter}
    </div>
    <div className="pc-card-flush hidden overflow-hidden sm:block">
      <div className="overflow-x-auto">
        <table className="pc-table min-w-[680px]">
          <thead><tr><th>{t("generated.matches.matchId")}</th><th>{t("generated.matches.map")}</th><th>{t("generated.matches.region")}</th><th className="text-right">{t("generated.matches.duration")}</th><th>{t("generated.matches.date.eb9a4bc")}</th></tr></thead>
          <tbody>{matches.map((match) => <MatchRow key={match.match_id} match={match} />)}</tbody>
        </table>
      </div>
      {desktopFooter}
    </div>
  </>;
}

function MatchRow({ match }: { match: MatchSearchResult }) {
  const href = `/matches/${match.match_id}`;
  return <tr><td><Link href={href} className="block font-mono text-xs font-medium text-pc-accent">#{match.match_id}</Link></td><td><Link href={href} className="block text-xs">{match.map}</Link></td><td><Link href={href} className="block text-xs">{match.region}</Link></td><td className="text-right font-mono tabular-nums"><Link href={href} className="block text-xs">{formatDuration(match.duration_seconds)}</Link></td><td><Link href={href} className="block text-xs">{formatLocalDateTime(match.entry_datetime)}</Link></td></tr>;
}

function MatchCard({ match }: { match: MatchSearchResult }) {
  const { t, formatDateTime } = useLocalization();
  const href = `/matches/${match.match_id}`;
  return <Link href={href} className="pc-mobile-panel block p-3 transition-colors hover:border-pc-accent-mid"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold text-pc-text">{match.map || t("generated.matches.unknownMap")}</div><div className="mt-0.5 font-mono text-xs text-pc-accent">#{match.match_id}</div></div><span className="rounded-full border border-pc-border bg-pc-bg px-2 py-1 text-xs uppercase text-pc-text-secondary">{match.region || "—"}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.matches.duration")}</div><div className="font-mono tabular-nums text-pc-text-secondary">{formatDuration(match.duration_seconds)}</div></div><div className="text-right"><div className="text-xs uppercase text-pc-text-muted">{t("generated.matches.played")}</div><div className="text-pc-text-secondary">{formatDateTime(match.entry_datetime)}</div></div></div></Link>;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
