/**
 * Render the tier-list PNG export action.
 * refs: none
 */
"use client";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { LoadingIndicator } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import type { TierListMode } from "@/lib/tierlists-api";

type TierListExportButtonProps = {
  tierListId: number;
  mode: TierListMode;
  target: RefObject<HTMLElement | null>;
};

async function tierListPng(board: HTMLElement): Promise<string> {
  const exportWidth = 1280;
  const canvasWidth = 2048;
  const originalStyle = board.style.cssText;
  board.setAttribute("data-image-export", "true");
  board.style.width = `${exportWidth}px`;
  board.style.maxWidth = "none";
  board.style.transform = "none";
  try {
    await document.fonts.ready;
    await Promise.all(Array.from(board.querySelectorAll("img")).map((image) => {
      if (image.complete) return image.decode?.().catch(() => undefined) ?? Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }));
    const computedStyle = window.getComputedStyle(board);
    const exportHeight = board.clientHeight
      + parseFloat(computedStyle.borderTopWidth || "0")
      + parseFloat(computedStyle.borderBottomWidth || "0");
    const canvasHeight = Math.max(1, Math.round(exportHeight * canvasWidth / exportWidth));
    return await toPng(board, {
      width: exportWidth,
      height: exportHeight,
      canvasWidth,
      canvasHeight,
      pixelRatio: 1,
      cacheBust: false,
      backgroundColor: "var(--pc-bg-secondary)",
      style: { transform: "none", transformOrigin: "top left" },
    });
  } finally {
    board.style.cssText = originalStyle;
    board.removeAttribute("data-image-export");
  }
}

/** Render a localized tier-list PNG download button. */
export default function TierListExportButton({ tierListId, mode, target }: TierListExportButtonProps) {
  const { t } = useLocalization();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportImage() {
    setExporting(true);
    setMessage(null);
    try {
      const board = target.current;
      if (!board) throw new Error(t("tierLists.exportError"));
      const dataUrl = await tierListPng(board);
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `paladinscat-${mode}-tier-list-${tierListId}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setMessage(t("tierLists.exportedImage"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("tierLists.exportError"));
    } finally {
      setExporting(false);
    }
  }

  return <div className="flex items-center gap-2">
    {message && <span className="hidden text-xs text-pc-text-secondary sm:inline" role="status">{message}</span>}
    <button type="button" onClick={exportImage} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-1.5 text-xs font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-60" title={t("tierLists.exportImage")}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      {exporting ? <LoadingIndicator className="gap-2" /> : t("tierLists.exportImage")}
    </button>
  </div>;
}
