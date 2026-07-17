"use client";

import { useState, useEffect } from "react";
import type { MatchFactPlayer } from "@/lib/api-client";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import { useLocalization } from "@/lib/localization-context";

interface LoadoutStripProps {
  fact: MatchFactPlayer;
}

interface MaterialIconProps {
  src: string | null | undefined;
  fallbackSrc: string | null | undefined;
  alt: string;
  className?: string;
}

function MaterialIcon({ src, fallbackSrc, alt, className = "w-8 h-8 object-cover" }: MaterialIconProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src, fallbackSrc]);
  const imageSrc = failed ? fallbackSrc : src;
  if (!imageSrc) {
    return <div className={`flex items-center justify-center text-xs text-pc-text-muted ${className}`}>#</div>;
  }
  return (
    <img src={imageSrc} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
  );
}

export default function LoadoutStrip({ fact }: LoadoutStripProps) {
  const { t } = useLocalization();
  const allMaterials = [
    ...fact.talents.map((t) => ({ type: "talent" as const, ...t })),
    ...fact.items.map((i) => ({ type: "item" as const, ...i })),
    ...fact.cards.map((c) => ({ type: "card" as const, ...c })),
  ];

  if (allMaterials.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {allMaterials.map((m, idx) => {
        const label = (m as any).talent_name || (m as any).item_name || (m as any).card_name || t("generated.components.matchResult.loadoutStrip.unknown");
        const src = (m as any).icon_url;
        const fallbackSrc = (m as any).fallback_icon_url;
        const colorClass = m.type === "item"
          ? "border-pc-accent/25 bg-pc-bg-secondary"
          : "border-blue-500/25 bg-blue-500/10";

        // item_level and card_level (talents don't have a level)
        const level = m.type === "item"
          ? (m as any).item_level ?? null
          : m.type === "card"
          ? (m as any).card_level ?? null
          : null;

        return (
          <div
            key={idx}
            className={m.type === "talent" ? "group relative flex flex-col items-center" : `group relative flex flex-col items-center gap-1 rounded-md border p-2 ${colorClass}`}
            title={level ? t("generated.matches.value1LevelValue2", { value1: label, value2: level }) : label}
          >
            {m.type === "talent" ? (
              <CanonicalTalentImage
                talentId={m.talent_id}
                talentName={m.talent_name}
                className="h-12 w-12 object-contain"
                fallbackClassName="h-12 w-12"
              />
            ) : (
              <MaterialIcon
                src={src}
                fallbackSrc={fallbackSrc}
                alt={label}
                className="w-8 h-8"
              />
            )}
            {/* Level badge — visible on hover or for leveled items/cards */}
            {level !== null && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pc-text text-xs font-bold text-pc-bg">
                {level}
              </span>
            )}
            {/* Tooltip label — always visible for screen readers, shown on hover */}
            <span className="sr-only">{level ? t("generated.matches.value1LevelValue2.a8f4500", { value1: label, value2: level }) : label}</span>
            <span className="hidden group-hover:inline-block text-xs text-pc-text-muted truncate max-w-[4rem] text-center pointer-events-none absolute left-full top-1/2 z-10 -translate-y-1/2 whitespace-nowrap bg-pc-bg-elevated border border-pc-border rounded px-1 py-0.5">
              {level ? t("generated.matches.value1LvlValue2", { value1: label, value2: level }) : label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
