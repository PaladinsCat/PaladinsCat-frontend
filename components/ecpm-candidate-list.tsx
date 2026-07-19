"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchEcpmCandidates,
  type EcpmCandidate,
  type EcpmCandidateBracket,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import {
  ecpmActivityLabelKey,
  ecpmActivityTextClass,
  type EcpmActivityLabelKey,
} from "@/lib/ecpm-activity";
import { useLocalization } from "@/lib/localization-context";
import { championSlug } from "@/lib/utils";

const BRACKETS: Array<{
  value: EcpmCandidateBracket;
  labelKey: EcpmActivityLabelKey;
  sample: number;
  range: string;
  automatic: boolean;
}> = [
  { value: "possible-disconnect", labelKey: "common.activity.possibleDisconnect", sample: 115, range: "110–119", automatic: false },
  { value: "disconnected", labelKey: "generated.stats.egpm.disconnected", sample: 100, range: "90–109", automatic: false },
  { value: "partial-afk", labelKey: "generated.stats.egpm.partialAfk", sample: 80, range: "70–89", automatic: false },
  { value: "full-afk", labelKey: "generated.stats.egpm.fullAfk", sample: 60, range: "0–69", automatic: true },
];

const EMPTY_COUNTS: Record<EcpmCandidateBracket, { count: number; percentage: number }> = {
  "possible-disconnect": { count: 0, percentage: 0 },
  disconnected: { count: 0, percentage: 0 },
  "partial-afk": { count: 0, percentage: 0 },
  "full-afk": { count: 0, percentage: 0 },
};

function CandidateOutcome({ value }: { value: string }) {
  const { t } = useLocalization();
  const won = ["winner", "win"].includes(value.toLowerCase());
  return <span className={won ? "text-emerald-400" : "text-red-400"}>{t(won ? "common.result.winShort" : "common.result.lossShort")}</span>;
}

export function EcpmCandidateList({ tierMin, tierMax }: { tierMin?: number; tierMax?: number }) {
  const { t, formatDateTime, formatDuration, formatNumber, formatPercent } = useLocalization();
  const [bracket, setBracket] = useState<EcpmCandidateBracket>("possible-disconnect");
  const [rows, setRows] = useState<EcpmCandidate[]>([]);
  const [bracketCounts, setBracketCounts] = useState(EMPTY_COUNTS);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetchEcpmCandidates({ bracket, tierMin, tierMax, limit: 20 })
      .then((page) => {
        if (cancelled) return;
        setRows(page.data);
        setCursor(page.nextCursor);
        setBracketCounts(page.bracketCounts);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setCursor(null);
        setFailed(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bracket, tierMax, tierMin]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setFailed(false);
    try {
      const page = await fetchEcpmCandidates({ bracket, tierMin, tierMax, cursor, limit: 20 });
      setRows((current) => [...current, ...page.data]);
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [bracket, cursor, loadingMore, tierMax, tierMin]);

  return <section>
    <div className="mb-3">
      <h2 className="text-sm font-bold text-pc-text">{t("common.activity.candidates")}</h2>
      <p className="mt-1 text-xs text-pc-text-muted">{t("common.activity.candidatesDescription")}</p>
    </div>

    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {BRACKETS.map((definition) => {
        const count = bracketCounts[definition.value];
        const active = bracket === definition.value;
        return <button
          key={definition.value}
          type="button"
          onClick={() => setBracket(definition.value)}
          className={`rounded-xl border p-3 text-left transition-colors ${active ? "border-pc-accent bg-pc-accent/10" : "border-pc-border bg-pc-bg-elevated hover:border-pc-accent/50"}`}
        >
          <span className={`block text-sm font-semibold ${ecpmActivityTextClass(definition.sample)}`}>{t(definition.labelKey)}</span>
          <span className="mt-1 block font-mono text-xs text-pc-text-secondary">{definition.range} {t("common.metrics.ecpm")}</span>
          <span className="mt-1 block text-xs text-pc-text-muted">{formatNumber(count.count)} · {formatPercent(count.percentage)} · {t(definition.automatic ? "common.activity.automaticFlag" : "common.activity.reviewOnly")}</span>
        </button>;
      })}
    </div>

    <div className="mt-3 overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated">
      <table className="w-full min-w-[900px] text-sm">
        <thead><tr className="border-b border-pc-border text-left text-xs uppercase tracking-wider text-pc-text-muted">
          <th className="px-4 py-3">{t("generated.matches.player")}</th>
          <th className="px-3 py-3">{t("generated.matches.champion")}</th>
          <th className="px-3 py-3 text-right">{t("common.metrics.ecpm")}</th>
          <th className="px-3 py-3">{t("common.activity.classification")}</th>
          <th className="px-3 py-3">{t("common.activity.policy")}</th>
          <th className="px-3 py-3">{t("generated.matches.match")}</th>
          <th className="px-4 py-3">{t("generated.matches.map")}</th>
        </tr></thead>
        <tbody>
          {!loading && rows.map((row) => {
            const labelKey = ecpmActivityLabelKey(row.ecpm)!;
            const automatic = row.ecpm < 70;
            return <tr key={`${row.matchId}:${row.playerId}`} className="border-b border-pc-border/50 last:border-b-0">
              <td className="px-4 py-3"><Link href={`/players/${row.playerId}`} className="font-semibold text-pc-text hover:text-pc-accent">{row.playerName}</Link><div className="mt-0.5 text-xs text-pc-text-muted">{formatDateTime(row.entryDatetime)}</div></td>
              <td className="px-3 py-3"><Link href={`/champions/${championSlug(row.championName)}`} className="flex items-center gap-2 text-pc-text-secondary hover:text-pc-accent"><img src={getChampionIconSafe(row.championName)} alt="" className="h-8 w-8 rounded object-contain" /><span>{row.championName}</span></Link></td>
              <td className={`px-3 py-3 text-right font-mono font-bold tabular-nums ${ecpmActivityTextClass(row.ecpm)}`}>{formatNumber(row.ecpm, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-3 py-3"><span className={`font-medium ${ecpmActivityTextClass(row.ecpm)}`}>{t(labelKey)}</span></td>
              <td className="px-3 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${automatic ? "border-red-400/40 bg-red-400/10 text-red-300" : "border-yellow-300/40 bg-yellow-300/10 text-yellow-200"}`}>{t(automatic ? "common.activity.automaticFlag" : "common.activity.reviewOnly")}</span></td>
              <td className="px-3 py-3"><Link href={`/matches/${row.matchId}`} className="font-mono text-pc-accent hover:underline">#{row.matchId}</Link><div className="mt-0.5 text-xs text-pc-text-muted"><CandidateOutcome value={row.winStatus} /> · {formatDuration(row.durationSeconds)}</div></td>
              <td className="px-4 py-3 text-pc-text-secondary"><div>{row.map ?? t("generated.matches.unknownMap")}</div><div className="mt-0.5 text-xs text-pc-text-muted">{row.region ?? t("common.fallback.unknownRegion")}{row.recovered && <> · {t("generated.matches.recovered")}</>}</div></td>
            </tr>;
          })}
          {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-pc-text-muted">{t("async.loading")}</td></tr>}
          {!loading && rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-pc-text-muted">{failed ? t("common.activity.candidatesLoadFailed") : t("common.activity.noCandidates")}</td></tr>}
        </tbody>
      </table>
    </div>
    {failed && rows.length > 0 && <p className="mt-2 text-xs text-red-300">{t("common.activity.candidatesLoadFailed")}</p>}
    {cursor && <div className="mt-3 text-center"><button type="button" disabled={loadingMore} onClick={loadMore} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-4 py-2 text-sm font-semibold text-pc-text-secondary transition-colors hover:border-pc-accent hover:text-pc-accent disabled:cursor-wait disabled:opacity-60">{loadingMore ? t("async.loading") : t("common.activity.loadMoreCandidates")}</button></div>}
  </section>;
}
