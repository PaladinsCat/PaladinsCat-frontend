/**
 * Lite mode — disables all animations for low-powered devices.
 * refs: none
 */
"use client";

import { useEffect } from "react";
import { getLiteMode, LITE_MODE_CHANGE_EVENT } from "@/lib/lite-mode";

/**
 * Lite mode — disables all animations for low-powered devices.
 *
 * When enabled it tags <html> with `pc-lite`; shared CSS and the local
 * reduced-motion hook then disable decorative animation.
 * refs: none
 * I/O types: `{ children }: { children: React.ReactNode } -> ReactNode`.
 */
export default function LiteModeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sync = () => {
      const enabled = getLiteMode();
      document.documentElement.classList.toggle("pc-lite", enabled);
    };
    sync();
    window.addEventListener(LITE_MODE_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LITE_MODE_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return children;
}
