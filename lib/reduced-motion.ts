/** Combine operating-system motion preference with the site's lite-mode setting. · refs: none */
"use client";

import { useSyncExternalStore } from "react";
import { getLiteMode, LITE_MODE_CHANGE_EVENT } from "@/lib/lite-mode";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  window.addEventListener(LITE_MODE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener(LITE_MODE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function snapshot() {
  return getLiteMode() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribe React components to the shared reduced-motion signal. · refs: none */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
