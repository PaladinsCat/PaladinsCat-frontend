"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { LoadingIndicator } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

type MatchExportButtonProps = {
  matchId: number;
  target: RefObject<HTMLElement | null>;
};

export default function MatchExportButton(props: MatchExportButtonProps) {
  const { t } = useLocalization();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportImage() {
    setExporting(true);
    setMessage(null);
    try {
      const scoreboard = props.target.current;
      if (!scoreboard) throw new Error(t("generated.matches.theScoreboardIsStillLoadingPleaseTryAgain"));

      // html-to-image serializes a CSS pseudo-element background unreliably.
      // The scoreboard exposes the identical map as an image only while it is
      // being captured, so the browser output retains the rendered backdrop.
      scoreboard.dataset.imageExport = "true";
      try {
        await Promise.all(Array.from(scoreboard.querySelectorAll("img")).map((image) => {
          if (image.complete) return image.decode?.().catch(() => undefined) ?? Promise.resolve();
          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }));

        const dataUrl = await toPng(scoreboard, {
          // The on-page scoreboard is deliberately scaled to the prototype's
          // 2048×1152 canvas. Capture its native 1280×720 layout instead and
          // let the canvas provide the higher-resolution PNG.
          width: 1280,
          height: 720,
          canvasWidth: 2048,
          canvasHeight: 1152,
          pixelRatio: 1,
          cacheBust: false,
          backgroundColor: "#161618",
          style: { transform: "none", transformOrigin: "top left" },
        });
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `paladinscat-match-${props.matchId}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setMessage(t("generated.matches.pngSaved"));
      } finally {
        delete scoreboard.dataset.imageExport;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this match image.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="hidden text-xs text-pc-text-secondary sm:inline" role="status">{message}</span>}
      <button type="button" onClick={exportImage} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-1.5 text-xs font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-60" title={t("generated.matches.saveA20481152MatchPng")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        {exporting ? <LoadingIndicator className="gap-2" /> : t("generated.matches.saveImage")}
      </button>
    </div>
  );
}
