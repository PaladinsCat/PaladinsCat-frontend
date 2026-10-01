/**
 * Renders match export button data for match-result views.
 * Keeps the component's interaction and accessibility behavior intact.
 * refs: none
 */
"use client";
import { formatApiErrorMessage } from "@/lib/api-errors";

import { useEffect, useState, type RefObject } from "react";
import { toSvg } from "html-to-image";
import { LoadingIndicator } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import { Download } from "lucide-react";

type MatchExportButtonProps = {
  matchId: number;
  target: RefObject<HTMLElement | null>;
};

declare global {
  interface Window {
    __paladinscatMatchScoreboardPng?: () => Promise<string>;
  }
}

async function scoreboardPng(scoreboard: HTMLElement) {
  const exportMap = scoreboard.querySelector<HTMLImageElement>("img.scoreboard-map");
  const exportMapSource = exportMap?.dataset.exportSrc;
  if (exportMap && exportMapSource) exportMap.src = exportMapSource;
  scoreboard.setAttribute("data-image-export", "true");
  const elements = [scoreboard, ...scoreboard.querySelectorAll<HTMLElement>("*")];
  try {
    const talentDeadline = performance.now() + 2_000;
    while (scoreboard.querySelector('span.talent-icon[role="img"]') && performance.now() < talentDeadline) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    await document.fonts.ready;
    await Promise.all(Array.from(scoreboard.querySelectorAll("img")).map((image) => {
      if (image.complete) return image.decode?.().catch(() => undefined) ?? Promise.resolve();
      return new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }));
    // html-to-image floors every copied font size and subtracts 0.1px.
    // Restore the web view's computed sizes in its embedded SVG before rasterizing.
    for (const element of elements) {
      element.setAttribute("data-export-font-size", getComputedStyle(element).fontSize);
    }
    const svgUrl = await toSvg(scoreboard, {
      width: 1280,
      height: 720,
      cacheBust: false,
      style: { transform: "none", transformOrigin: "top left" },
    });
    const svg = new DOMParser().parseFromString(decodeURIComponent(svgUrl.split(",")[1]!), "image/svg+xml");
    for (const element of svg.querySelectorAll<HTMLElement>("[data-export-font-size]")) {
      // Append without CSSOM shorthand normalization, which changes copied grid/flex styles.
      element.setAttribute("style", `${element.getAttribute("style")};font-size:${element.getAttribute("data-export-font-size")}`);
      element.removeAttribute("data-export-font-size");
    }
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1152;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = getComputedStyle(scoreboard).backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    for (const element of elements) element.removeAttribute("data-export-font-size");
    scoreboard.removeAttribute("data-image-export");
    exportMap?.removeAttribute("src");
  }
}

/**
 * Render MatchExportButton from its declared props and match data.
 * Contract: consumes the declared props, preserves event and accessibility behavior, and returns the corresponding UI element.
 * refs: none
 * I/O types: `props: MatchExportButtonProps -> JSX.Element`.
 */
export default function MatchExportButton(props: MatchExportButtonProps) {
  const { t } = useLocalization();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const render = async () => {
      const scoreboard = props.target.current;
      if (!scoreboard) throw new Error(t("generated.matches.theScoreboardIsStillLoadingPleaseTryAgain"));
      return scoreboardPng(scoreboard);
    };
    window.__paladinscatMatchScoreboardPng = render;
    return () => {
      if (window.__paladinscatMatchScoreboardPng === render) delete window.__paladinscatMatchScoreboardPng;
    };
  }, [props.target, t]);

  async function exportImage() {
    setExporting(true);
    setMessage(null);
    try {
      const scoreboard = props.target.current;
      if (!scoreboard) throw new Error(t("generated.matches.theScoreboardIsStillLoadingPleaseTryAgain"));

      const dataUrl = await scoreboardPng(scoreboard);
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `paladinscat-match-${props.matchId}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setMessage(t("generated.matches.pngSaved"));
    } catch (error) {
      setMessage(formatApiErrorMessage(error, t, t("generated.components.matchResult.matchExportButton.couldNotSaveMatchImage")));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="hidden text-xs text-pc-text-secondary sm:inline" role="status">{message}</span>}
      <button type="button" onClick={exportImage} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-1.5 text-xs font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-60" title={t("generated.matches.saveA20481152MatchPng")}>
        <Download aria-hidden="true" size={14} />
        {exporting ? <LoadingIndicator className="gap-2" /> : t("generated.matches.saveImage")}
      </button>
    </div>
  );
}
