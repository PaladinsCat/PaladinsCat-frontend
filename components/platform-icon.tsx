/** Render a compact, monochrome platform mark with a resilient PNG fallback. · refs: none */

type PlatformIconProps = {
  platform?: string | null;
};

type PlatformAsset = {
  label: string;
  avif: string;
  png: string;
};

const PLATFORM_ASSETS: Record<string, PlatformAsset> = {
  steam: { label: "Steam", avif: "/images/icons/platform/Platform_Steam.avif", png: "/images/icons/platform/Platform_Steam.png" },
  epic: { label: "Epic Games", avif: "/images/icons/platform/Platform_Epic_Games.avif?v=4", png: "/images/icons/platform/Platform_Epic_Games.png?v=4" },
  playstation: { label: "PlayStation", avif: "/images/icons/platform/Platform_PlayStation.avif", png: "/images/icons/platform/Platform_PlayStation.png" },
  xbox: { label: "Xbox", avif: "/images/icons/platform/Platform_Xbox.avif", png: "/images/icons/platform/Platform_Xbox.png" },
  hirez: { label: "Hi-Rez / PC", avif: "/images/icons/platform/Platform_HiRez_PC.avif", png: "/images/icons/platform/Platform_HiRez_PC.png" },
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

export default function PlatformIcon({ platform }: PlatformIconProps) {
  const asset = resolvePlatform(platform);
  if (!asset) return null;

  return (
    <span className="player-platform-icon" title={asset.label} aria-label={asset.label} role="img">
      <picture>
        <source srcSet={asset.avif} type="image/avif" />
        <img src={asset.png} alt="" width={18} height={18} loading="eager" decoding="async" />
      </picture>
    </span>
  );
}
