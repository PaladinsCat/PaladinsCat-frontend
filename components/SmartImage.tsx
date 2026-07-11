"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";
import { canonicalLocalImageUrl } from "@/lib/image-assets";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
}

/**
 * Tries .avif first, falls back to original format (png/webp).
 * Properly cancels stale probes when src changes rapidly (icon cycling).
 */
export default function SmartImage({ src, onError, ...props }: SmartImageProps) {
  const canonicalSrc = canonicalLocalImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState(() => {
    if (!canonicalSrc || canonicalSrc.startsWith("http")) return canonicalSrc;
    return canonicalSrc.replace(/\.[^.]+$/, ".avif");
  });

  useEffect(() => {
    if (!canonicalSrc) return;

    if (canonicalSrc.startsWith("http")) {
      setCurrentSrc(canonicalSrc);
      return;
    }

    const avifSrc = canonicalSrc.replace(/\.[^.]+$/, ".avif");
    let cancelled = false;

    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setCurrentSrc(avifSrc);
    };
    probe.onerror = () => {
      if (!cancelled) setCurrentSrc(canonicalSrc);
    };
    probe.src = avifSrc;

    return () => { cancelled = true; };
  }, [canonicalSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== canonicalSrc) {
      setCurrentSrc(canonicalSrc);
    }
    onError?.(e);
  };

  return <img src={currentSrc} onError={handleError} {...props} />;
}
