/** ImageAssetFallback component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect } from "react";
import { fallbackLocalImageUrl } from "@/lib/image-assets";

const FALLBACK_MARKER = "pcPngFallback";

/**
 * Raw image elements are used in dense tables and the fixed scoreboard canvas
 * where an extra wrapper would alter layout. Catch failed local AVIF requests
 * once at the document boundary and retry the matching PNG without changing
 * those elements' geometry.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function ImageAssetFallback() {
  useEffect(() => {
    const handleImageError = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;
      const source = image.getAttribute("src") ?? "";
      if (image.dataset[FALLBACK_MARKER] === source) return;
      if (!source.startsWith("/images/") || !/\.avif(?:[?#].*)?$/i.test(source)) return;

      const fallback = fallbackLocalImageUrl(source);
      if (fallback === source) return;

      // Do not let component-level terminal error handlers hide the image or
      // replace it with a generic asset until the PNG retry has also failed.
      event.stopPropagation();
      image.dataset[FALLBACK_MARKER] = source;
      image.removeAttribute("srcset");
      image.src = fallback;
    };

    window.addEventListener("error", handleImageError, true);
    return () => window.removeEventListener("error", handleImageError, true);
  }, []);

  return null;
}
