"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { getLiteMode, LITE_MODE_CHANGE_EVENT } from "@/lib/lite-mode";

/**
 * Lite mode — disables all animations for low-powered devices.
 *
 * When enabled it (1) forces framer-motion to skip every animation via
 * `MotionConfig reducedMotion="always"` and (2) tags <html> with `pc-lite` so
 * the global CSS rule can kill CSS animations/transitions (hover effects).
 */
export default function LiteModeProvider({ children }: { children: React.ReactNode }) {
  const [liteMode, setLiteModeState] = useState(false);

  useEffect(() => {
    const sync = () => {
      const enabled = getLiteMode();
      setLiteModeState(enabled);
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

  return (
    <MotionConfig reducedMotion={liteMode ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
