"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";
import { canonicalLocalImageUrl } from "@/lib/image-assets";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
}

/** Tries .avif first and lets the rendered image fall back to the source asset. */
export default function SmartImage({ src, onError, ...props }: SmartImageProps) {
  const canonicalSrc = canonicalLocalImageUrl(src);
  const preferredSrc = !canonicalSrc || canonicalSrc.startsWith("http")
    ? canonicalSrc
    : canonicalSrc.replace(/\.[^.]+$/, ".avif");
  const [currentSrc, setCurrentSrc] = useState(() => {
    return preferredSrc;
  });

  useEffect(() => {
    setCurrentSrc(preferredSrc);
  }, [preferredSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== canonicalSrc) {
      setCurrentSrc(canonicalSrc);
    }
    onError?.(e);
  };

  return <img src={currentSrc} onError={handleError} {...props} />;
}
