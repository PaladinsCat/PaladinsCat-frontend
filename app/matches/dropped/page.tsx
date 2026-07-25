"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/async-state";
import {
  fetchNonrankedDroppedMatches,
  type NonrankedDroppedMatchRecord,
  type PublicStatsScope,
} from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

const SCOPES = [
  { value: "", labelKey: "matches.dropped.allModes" },
  { value: "casual", labelKey: "stats.scope.casual" },
  { value: "team_deathmatch", labelKey: "stats.scope.teamDeathmatch" },
  { value: "arcade", labelKey: "stats.scope.arcade" },
  { value: "wave_defense", labelKey: "stats.scope.waveDefense" },
  { value: "experiment", labelKey: "stats.scope.experiment" },
  { value: "newcomer", labelKey: "stats.scope.newcomer" },
  { value: "bot", labelKey: "stats.scope.bot" },
] as const;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function reasonLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export default function DroppedMatchesPage() {
  const { t } = useLocalization();
  const [date, setDate] = useState(todayUtc);
  const [scope, setScope] = useState<"" | PublicStatsScope>("");
  const [rows, setRows] = useState<NonrankedDroppedMatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchNonrankedDroppedMatches({ date, scope: scope || undefined })
      .then((response) => {
        if (!cancelled) setRows(response.matches);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, scope]);

  const grouped = useMemo(() => {
    const groups = new Map<number, NonrankedDroppedMatchRecord[]>();
    for (const row of rows) groups.set(row.hour, [...(groups.get(row.hour) ?? []), row]);
    return [...groups.entries()].sort((left, right) => right[0] - left[0]);
  }, [rows]);

  return <div className="space-y-6">
    <header>
      <h1 className="pc-heading pc-heading-lg text-pc-accent">
        <ScrambleText text={t("matches.dropped.title")} speed={30} iterations={15} delayFromCenter={false} />
      </h1>
      <p className="mt-1 text-sm text-pc-text-secondary">
        {t("matches.dropped.description")}
      </p>
    </header>

    <section className="pc-card flex flex-wrap gap-3">
      <label className="text-xs text-pc-text-muted">
        {t("matches.dropped.utcDate")}
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="pc-input mt-1 block" />
      </label>
      <label className="text-xs text-pc-text-muted">
        {t("matches.dropped.mode")}
        <select value={scope} onChange={(event) => setScope(event.target.value as "" | PublicStatsScope)} className="pc-select mt-1 block">
          {SCOPES.map((entry) => <option key={entry.value || "all"} value={entry.value}>{t(entry.labelKey)}</option>)}
        </select>
      </label>
    </section>

    {loading && <LoadingPanel compact />}
    {error && !loading && <ErrorState message={t("matches.dropped.unavailable")} />}
    {!loading && !error && rows.length === 0 && (
      <EmptyState title={t("matches.dropped.emptyTitle")} description={t("matches.dropped.emptyDescription")} />
    )}
    {!loading && !error && grouped.map(([hour, matches]) => (
      <section key={hour} className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
        <div className="flex items-center justify-between border-b border-pc-border bg-pc-bg-secondary px-4 py-3">
          <h2 className="text-sm font-semibold text-pc-text">{t("matches.dropped.utcHour", { hour: String(hour).padStart(2, "0") })}</h2>
          <span className="font-mono text-xs text-pc-text-muted">{t("matches.dropped.ids", { count: matches.length })}</span>
        </div>
        <div className="divide-y divide-pc-border/60">
          {matches.map((match) => (
            <div key={match.match_id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[10rem_1fr_auto] sm:items-center">
              <Link href={`/matches/${match.match_id}`} className="font-mono font-semibold text-pc-accent hover:underline">
                #{match.match_id}
              </Link>
              <div className="min-w-0">
                <div className="text-pc-text">{match.queue_name}</div>
                <div className="truncate text-pc-text-muted">{reasonLabel(match.terminal_reason)}</div>
              </div>
              <div className="text-pc-text-muted">
                {t("matches.dropped.coverage", { detail: match.direct_player_count, roster: match.roster_player_count })}
              </div>
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>;
}
