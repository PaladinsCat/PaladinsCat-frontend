/** player-loading-frame component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
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
      width={96}
      height={96}
      className="h-full w-full object-cover"
      draggable={false}
      decoding="async"
      fetchPriority="high"
      loading="eager"
      onError={onAvatarError}
    />
  ) : (
    <img
      src="/images/icons/Avatar_Default_Icon.avif"
      alt={avatarAlt}
      width={96}
      height={96}
      className="h-full w-full object-cover"
      draggable={false}
      decoding="async"
      fetchPriority="high"
      loading="eager"
    />
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function PlayerLoadingFrame({
  loadingFrame,
  avatarUrl,
  avatarAlt,
  onAvatarError,
}: PlayerLoadingFrameProps) {
  const frame = resolveLoadingFrameAsset(loadingFrame);

  if (!frame) {
    return (
      <div className="relative h-[7rem] w-[5.2rem] shrink-0">
        <div className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 items-center justify-center overflow-hidden rounded-xl border-2 border-pc-accent/30 bg-pc-bg">
          <Avatar avatarUrl={avatarUrl} avatarAlt={avatarAlt} onAvatarError={onAvatarError} />
        </div>
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
          decoding="async"
        />
      </picture>
    </div>
  );
}
