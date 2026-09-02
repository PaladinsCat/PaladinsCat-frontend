/** Render champion bans with localized labels, icons, and links to champion pages. */
"use client";

import type { MatchBan } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLocalization } from "@/lib/localization-context";

interface MaterialIconProps {
  src: string | null | undefined;
  fallbackSrc: string | null | undefined;
  alt: string;
  className?: string;
}

function MaterialIcon({ src, fallbackSrc, alt, className = "w-8 h-8" }: MaterialIconProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src, fallbackSrc]);
  const imageSrc = failed ? fallbackSrc : src;
  if (!imageSrc) {
    return <div className={`flex items-center justify-center text-xs text-pc-text-muted ${className}`}>#</div>;
  }
  return <img src={imageSrc} alt={alt} className={`object-cover ${className}`} loading="lazy" onError={() => setFailed(true)} />;
}

interface BansSectionProps {
  bans: Array<{
    banSlot: number | null;
    championId: number;
    championName: string | null;
  }>;
}

/** Display both teams' ban choices, returning no section when the match has no bans.  Returns: `React.JSX.Element`. */
export default function BansSection({ bans }: BansSectionProps) {
  const { t } = useLocalization();
  if (bans.length === 0) return null;
  return (
    <section className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-pc-border">
        <span className="h-px flex-1 bg-pc-border" />
        <h2 className="text-xs font-bold text-pc-text uppercase tracking-[0.18em]">{t("generated.matches.matchBans")}</h2>
        <span className="h-px flex-1 bg-pc-border" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-pc-border">
        {bans.map((ban, i) => {
          const label = ban.championName || `Champion #${ban.championId}`;
          const content = (
            <div className="flex min-w-0 items-center gap-2 bg-pc-bg-elevated px-3 py-2.5 text-pc-text-secondary transition-colors hover:bg-red-500/10">
              <MaterialIcon
                src={getChampionIconSafe(ban.championName)}
                fallbackSrc={getChampionIconSafe(ban.championName)}
                alt={label}
                className="w-9 h-9 rounded border border-red-500/20 bg-pc-bg-secondary"
              />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-red-300/70">
                  {t("generated.matches.ban")}{" "}{ban.banSlot ?? i + 1}
                </div>
                <div className="truncate text-xs font-medium">{label}</div>
              </div>
            </div>
          );
          return ban.championName ? (
            <Link key={`${ban.banSlot ?? i}-${ban.championId}`} href={`/champions/${championSlug(ban.championName)}`}>
              {content}
            </Link>
          ) : (
            <div key={`${ban.banSlot ?? i}-${ban.championId}`}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
