"use client";

import { useState } from "react";
import type { MatchBan, MatchFactPlayer, MatchPlayerDetail } from "@/lib/api-client";
import { LoadingIndicator } from "@/components/async-state";
import type { PlayerProfileData } from "./types";
import {
  DEFAULT_MATCH_IMAGE_THEME,
  renderMatchScoreboard,
  type MatchImageTheme,
} from "./match-scoreboard-canvas";

type MatchExportButtonProps = {
  matchId: number;
  map: string;
  queueLabel: string;
  region: string;
  duration: string;
  team1Score: number;
  team2Score: number;
  team1Wins: boolean;
  team2Wins: boolean;
  team1: MatchPlayerDetail[];
  team2: MatchPlayerDetail[];
  bans?: MatchBan[];
  facts?: MatchFactPlayer[];
  profiles?: Map<string, PlayerProfileData> | null;
  theme?: MatchImageTheme;
};

export default function MatchExportButton(props: MatchExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportImage() {
    setExporting(true);
    setMessage(null);
    try {
      const canvas = await renderMatchScoreboard({
        ...props,
        theme: props.theme ?? DEFAULT_MATCH_IMAGE_THEME,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("The match image could not be encoded.");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `paladinscat-match-${props.matchId}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setMessage("Dark PNG saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not export this match.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="hidden text-xs text-pc-text-secondary sm:inline" role="status">{message}</span>}
      <button type="button" onClick={exportImage} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-1.5 text-xs font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-60" title="Save a dark 2048×1152 match PNG">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        {exporting ? <LoadingIndicator className="gap-2" /> : "Save image"}
      </button>
    </div>
  );
}
