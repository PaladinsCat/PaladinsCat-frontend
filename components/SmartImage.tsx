/**
 * Uses AVIF for local artwork and retries the matching PNG on failure.  Returns: `React.JSX.Element`. · refs: none
 * refs: none
 */
"use client";

import { useState, useEffect, ImgHTMLAttributes } from "react";
import { localImageSources } from "@/lib/image-assets";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
}

/**
 * Uses AVIF for local artwork and retries the matching PNG on failure.  Returns: `React.JSX.Element`. · refs: none
 * I/O types: `{ src, onError, ...props }: SmartImageProps -> JSX.Element`.
 */
export default function SmartImage({ src, onError, ...props }: SmartImageProps) {
  const sources = localImageSources(src);
  const [currentSrc, setCurrentSrc] = useState(sources.preferred);

  useEffect(() => {
    setCurrentSrc(sources.preferred);
  }, [sources.preferred]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== sources.fallback) {
      setCurrentSrc(sources.fallback);
      return;
    }
    onError?.(e);
  };

  return <img src={currentSrc} onError={handleError} {...props} />;
}
