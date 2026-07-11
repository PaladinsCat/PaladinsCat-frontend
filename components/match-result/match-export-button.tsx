"use client";

import { useState } from "react";
import type { MatchPlayerDetail } from "@/lib/api-client";

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
};

function number(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function playerDamage(player: MatchPlayerDetail) {
  return Number(player.damage_done_physical ?? 0) + Number(player.damage_done_magical ?? 0) + Number(player.damage_done_in_hand ?? 0);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 12) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.closePath();
}

export default function MatchExportButton(props: MatchExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportImage() {
    setExporting(true);
    setMessage(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1060;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser cannot create a match image.");

      const drawText = (text: string, x: number, y: number, size: number, color = "#f4f6fb", align: CanvasTextAlign = "left", weight = "500") => {
        context.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        context.fillStyle = color;
        context.textAlign = align;
        context.fillText(text, x, y);
      };

      context.fillStyle = "#10131a";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(37, 99, 235, 0.22)");
      gradient.addColorStop(0.52, "rgba(15, 23, 42, 0)");
      gradient.addColorStop(1, "rgba(190, 24, 93, 0.18)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      roundedRect(context, 36, 32, 1528, 156, 18);
      context.fillStyle = "rgba(17, 22, 32, 0.94)";
      context.fill();
      drawText("PALADINSCAT MATCH RESULT", 68, 78, 23, "#86efac", "left", "700");
      drawText(`${props.queueLabel} · ${props.map}`, 68, 116, 30, "#ffffff", "left", "700");
      drawText(`${props.region} · ${props.duration} · #${props.matchId}`, 68, 151, 18, "#aeb7ca");
      drawText(String(props.team1Score), 1372, 106, 52, props.team1Wins ? "#86efac" : "#e5e7eb", "center", "700");
      drawText("VS", 1446, 106, 20, "#8b95a7", "center", "700");
      drawText(String(props.team2Score), 1520, 106, 52, props.team2Wins ? "#86efac" : "#e5e7eb", "center", "700");
      drawText(props.team1Wins ? "WINNER" : "", 1372, 145, 15, "#86efac", "center", "700");
      drawText(props.team2Wins ? "WINNER" : "", 1520, 145, 15, "#86efac", "center", "700");

      const columns = [
        ["Champion / Player", 72, "left"], ["K / D / A", 700, "center"], ["KDA", 830, "center"], ["Damage", 1010, "right"], ["Healing", 1190, "right"], ["Mitigation", 1390, "right"],
      ] as const;
      const drawTeam = (players: MatchPlayerDetail[], startY: number, name: string, wins: boolean, accent: string) => {
        roundedRect(context, 36, startY, 1528, 48, 12);
        context.fillStyle = wins ? "rgba(34, 197, 94, 0.20)" : "rgba(71, 85, 105, 0.42)";
        context.fill();
        drawText(`${name}${wins ? " · WINNER" : ""}`, 64, startY + 31, 18, accent, "left", "700");
        columns.forEach(([label, x, align]) => drawText(label, x, startY + 31, 15, "#c5ccda", align, "700"));

        players.slice(0, 5).forEach((player, index) => {
          const y = startY + 60 + index * 66;
          roundedRect(context, 36, y, 1528, 56, 10);
          context.fillStyle = index % 2 === 0 ? "rgba(255, 255, 255, 0.055)" : "rgba(255, 255, 255, 0.025)";
          context.fill();
          context.fillStyle = wins ? "#22c55e" : "#64748b";
          context.fillRect(36, y, 5, 56);
          drawText(player.champion_name || "Unknown Champion", 64, y + 24, 16, "#9eacc4", "left", "600");
          drawText(player.player_name || "PRIVATE", 64, y + 45, 23, "#ffffff", "left", "700");
          drawText(`${number(player.kills)} / ${number(player.deaths)} / ${number(player.assists)}`, 700, y + 35, 20, "#f8fafc", "center", "700");
          drawText(Number(player.kda ?? 0).toFixed(2), 830, y + 35, 20, "#f8fafc", "center", "700");
          drawText(number(playerDamage(player)), 1010, y + 35, 20, "#f8fafc", "right", "700");
          drawText(number(player.healing), 1190, y + 35, 20, "#f8fafc", "right", "700");
          drawText(number(player.damage_mitigated), 1390, y + 35, 20, "#f8fafc", "right", "700");
        });
      };

      drawTeam(props.team1, 218, "TEAM 1", props.team1Wins, "#7dd3fc");
      drawTeam(props.team2, 616, "TEAM 2", props.team2Wins, "#fda4af");
      drawText("Made with PaladinsCat · paladinscat.com", 68, 1020, 16, "#8b95a7");
      drawText("Share the result", 1532, 1020, 16, "#8b95a7", "right");

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
      setMessage("PNG saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not export this match.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="hidden text-xs text-pc-text-secondary sm:inline" role="status">{message}</span>}
      <button type="button" onClick={exportImage} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-1.5 text-xs font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-60" title="Save a shareable PNG">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        {exporting ? "Preparing…" : "Save image"}
      </button>
    </div>
  );
}
