/**
 * Render loadout export button with `LoadingIndicator`.
 * refs: none
 */
"use client";
import { formatApiErrorMessage } from "@/lib/api-errors";

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { LoadingIndicator } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import { Download } from "lucide-react";

type LoadoutExportButtonProps = {
  championName: string;
  loadoutId: number;
  target: RefObject<HTMLElement | null>;
};

function downloadName(championName: string, loadoutId: number) {
  const champion = championName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `paladinscat-loadout-${champion || "champion"}-${loadoutId}.png`;
}

/**
 * Render loadout export button with `LoadingIndicator`.
 * refs: none
 * I/O types: `props: LoadoutExportButtonProps -> JSX.Element`.
 */
export default function LoadoutExportButton(props: LoadoutExportButtonProps) {
  const { t } = useLocalization();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportImage() {
    setExporting(true);
    setMessage(null);
    try {
      const loadout = props.target.current;
      if (!loadout) throw new Error(t("generated.players.theLoadoutIsStillLoadingPleaseTryAgain"));

      // Lock the cloned target to the same 1280×720, five-card composition
      // used by the Discord renderer, regardless of the current viewport.
      loadout.setAttribute("data-image-export", "true");
      try {
        await Promise.all(Array.from(loadout.querySelectorAll("img")).map((image) => {
          if (image.complete) return image.decode?.().catch(() => undefined) ?? Promise.resolve();
          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }));

        const dataUrl = await toPng(loadout, {
          width: 1280,
          height: 720,
          canvasWidth: 2048,
          canvasHeight: 1152,
          pixelRatio: 1,
          cacheBust: false,
          backgroundColor: "var(--pc-bg-secondary)",
          style: { transform: "none", transformOrigin: "top left" },
        });
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = downloadName(props.championName, props.loadoutId);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setMessage(t("generated.matches.pngSaved"));
      } finally {
        loadout.removeAttribute("data-image-export");
      }
    } catch (error) {
      setMessage(formatApiErrorMessage(error, t, t("generated.players.couldNotSaveTheLoadoutImage")));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="hidden text-xs text-pc-text-secondary sm:inline" role="status">{message}</span>}
      <button type="button" onClick={exportImage} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-1.5 text-xs font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-60" title={t("generated.players.saveA20481152LoadoutPng")}>
        <Download aria-hidden="true" size={14} />
        {exporting ? <LoadingIndicator className="gap-2" /> : t("generated.matches.saveImage")}
      </button>
    </div>
  );
}
