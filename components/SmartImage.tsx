"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
}

/**
 * Tries .avif first, falls back to original format (png/webp).
 * Properly cancels stale probes when src changes rapidly (icon cycling).
 */
export default function SmartImage({ src, onError, ...props }: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => {
    if (!src || src.startsWith("http")) return src;
    return src.replace(/\.[^.]+$/, ".avif");
  });

  useEffect(() => {
    if (!src) return;

    if (src.startsWith("http")) {
      setCurrentSrc(src);
      return;
    }

    const avifSrc = src.replace(/\.[^.]+$/, ".avif");
    let cancelled = false;

    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setCurrentSrc(avifSrc);
    };
    probe.onerror = () => {
      if (!cancelled) setCurrentSrc(src);
    };
    probe.src = avifSrc;

    return () => { cancelled = true; };
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== src) {
      setCurrentSrc(src);
    }
    onError?.(e);
  };

  return <img src={currentSrc} onError={handleError} {...props} />;
}
