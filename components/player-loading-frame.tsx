"use client";

import { resolveLoadingFrameAsset } from "@/lib/loading-frame-assets";

interface PlayerLoadingFrameProps {
  loadingFrame: string | null | undefined;
  avatarUrl: string | null;
  avatarAlt: string;
  onAvatarError?: () => void;
}

function Avatar({
  avatarUrl,
  avatarAlt,
  onAvatarError,
}: Pick<PlayerLoadingFrameProps, "avatarUrl" | "avatarAlt" | "onAvatarError">) {
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={avatarAlt}
      className="h-full w-full object-cover"
      draggable={false}
      onError={onAvatarError}
    />
  ) : (
    <img
      src="/images/icons/Avatar_Default_Icon.avif"
      alt={avatarAlt}
      className="h-full w-full object-cover"
      draggable={false}
    />
  );
}

export default function PlayerLoadingFrame({
  loadingFrame,
  avatarUrl,
  avatarAlt,
  onAvatarError,
}: PlayerLoadingFrameProps) {
  const frame = resolveLoadingFrameAsset(loadingFrame);

  if (!frame) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-pc-accent/30 bg-pc-bg">
        <Avatar avatarUrl={avatarUrl} avatarAlt={avatarAlt} onAvatarError={onAvatarError} />
      </div>
    );
  }

  return (
    <div
      className="relative h-[7rem] w-[5.2rem] shrink-0"
      title={frame.name}
      aria-label={frame.name}
    >
      <div className="absolute inset-x-[21%] bottom-[15%] top-[18%] overflow-hidden bg-pc-bg">
        <Avatar avatarUrl={avatarUrl} avatarAlt={avatarAlt} onAvatarError={onAvatarError} />
      </div>
      <picture>
        {frame.preferredFormat === "webp" && <source srcSet={frame.assets.webp} type="image/webp" />}
        <img
          src={frame.assets.gif}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          draggable={false}
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
