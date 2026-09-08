/** Render a compact, monochrome platform mark with a resilient PNG fallback. · refs: none */
"use client";

import { useLocalization, type TranslationKey } from "@/lib/localization-context";

type PlatformIconProps = {
  platform?: string | null;
};

type PlatformAsset = {
  labelKey: TranslationKey;
  avif: string;
  png: string;
};

const PLATFORM_ASSETS: Record<string, PlatformAsset> = {
  steam: { labelKey: "common.platform.steam", avif: "/images/icons/platform/Platform_Steam.avif", png: "/images/icons/platform/Platform_Steam.png" },
  epic: { labelKey: "common.platform.epic", avif: "/images/icons/platform/Platform_Epic_Games.avif?v=4", png: "/images/icons/platform/Platform_Epic_Games.png?v=4" },
  playstation: { labelKey: "common.platform.playstation", avif: "/images/icons/platform/Platform_PlayStation.avif", png: "/images/icons/platform/Platform_PlayStation.png" },
  xbox: { labelKey: "common.platform.xbox", avif: "/images/icons/platform/Platform_Xbox.avif", png: "/images/icons/platform/Platform_Xbox.png" },
  hirez: { labelKey: "common.platform.hirez", avif: "/images/icons/platform/Platform_HiRez_PC.avif", png: "/images/icons/platform/Platform_HiRez_PC.png" },
};

function resolvePlatform(platform: string | null | undefined): PlatformAsset | null {
  const normalized = String(platform ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (!normalized) return null;
  if (normalized.includes("steam")) return PLATFORM_ASSETS.steam;
  if (normalized.includes("epic")) return PLATFORM_ASSETS.epic;
  if (normalized.includes("playstation") || normalized === "psn" || normalized === "ps4" || normalized === "ps5") return PLATFORM_ASSETS.playstation;
  if (normalized.includes("xbox")) return PLATFORM_ASSETS.xbox;
  if (normalized.includes("hirez") || normalized === "pc" || normalized.includes("launcher")) return PLATFORM_ASSETS.hirez;
  return null;
}

/**
 * Render the existing platform asset or no mark for unknown input.
 * I/O: PlatformIconProps -> React.JSX.Element | null.
 * refs: see: components/match-result/browser-scoreboard.tsx
 * I/O types: `{ platform }: PlatformIconProps -> JSX.Element | null`.
 */
export default function PlatformIcon({ platform }: PlatformIconProps) {
  const { t } = useLocalization();
  const asset = resolvePlatform(platform);
  if (!asset) return null;

  return (
    <span className="player-platform-icon inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center" title={t(asset.labelKey)} aria-label={t(asset.labelKey)} role="img">
      <picture>
        <source srcSet={asset.avif} type="image/avif" />
        <img src={asset.png} alt="" width={18} height={18} loading="eager" decoding="async" />
      </picture>
    </span>
  );
}
