"use client";

import Link from "next/link";
import type { MatchSearchResult } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

/** Format duration seconds → "mm:ss" */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RelatedMatches({ related, matchId, loading }: { related: MatchSearchResult[]; matchId: number; loading: boolean }) {
  const { t } = useLocalization();
  if (loading) return null;
  if (related.length === 0) return null;

  return (
    <section className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 sm:p-6">
      <h2 className="text-lg font-bold text-pc-text uppercase tracking-wide mb-4">{t("generated.matches.relatedMatches")}</h2>
      <div className="space-y-2">
        {related.map((m, i) => (
          <Link
            key={`${m.match_id}-${i}`}
            href={`/matches/${m.match_id}`}
            className="flex items-center justify-between p-3 rounded-lg bg-pc-bg-secondary hover:bg-pc-bg-elevated border border-transparent hover:border-pc-border transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${m.win_status === t("generated.components.matchResult.relatedMatches.winner") ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-pc-text font-medium">{t("generated.matches.match")}{m.match_id}</span>
              <span className="text-pc-text-secondary text-sm">{m.champion_name}</span>
            </div>
            <div className="text-sm text-pc-text-muted">
              {m.kills}/{m.deaths}/{m.assists} · {formatDuration(m.duration_seconds)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}