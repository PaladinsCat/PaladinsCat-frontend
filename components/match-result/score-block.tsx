/**
 * Renders score block data for match-result views.
 * Keeps the component's interaction and accessibility behavior intact.
 */
import type { ScoreBlockData } from "./types";
import { LocalizedText } from "@/lib/localization-context";

/** Render ScoreBlock from its declared props and match data.
 * Contract: consumes the declared props, preserves event and accessibility behavior, and returns the corresponding UI element.
 */
export default function ScoreBlock({ data }: { data: ScoreBlockData }) {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <div className={`text-center px-6 py-3 rounded-xl ${data.team1Wins ? "bg-green-500/10 border-2 border-green-500/40" : "bg-pc-bg-secondary/50 border-2 border-pc-border"}`}>
        <div className="text-xs uppercase tracking-wider text-pc-text-muted">{data.team1Label}</div>
        <div className={`text-3xl font-bold ${data.team1Wins ? "text-green-400" : "text-pc-text-secondary"}`}>
          {data.team1Score ?? "?"}
        </div>
      </div>
      <div className="text-pc-text-muted text-lg font-medium"><LocalizedText id="generated.matches.vs" /></div>
      <div className={`text-center px-6 py-3 rounded-xl ${data.team2Wins ? "bg-green-500/10 border-2 border-green-500/40" : "bg-pc-bg-secondary/50 border-2 border-pc-border"}`}>
        <div className="text-xs uppercase tracking-wider text-pc-text-muted">{data.team2Label}</div>
        <div className={`text-3xl font-bold ${data.team2Wins ? "text-green-400" : "text-pc-text-secondary"}`}>
          {data.team2Score ?? "?"}
        </div>
      </div>
    </div>
  );
}
