/** Reads and tracks the reduced-motion preference.
 * The module owns the existing validation, policy, label, title, or preference behavior.
 */
"use client";

import { useReducedMotion as useFmReducedMotion } from "framer-motion";

/** Apply useReducedMotion to the declared player or request input.
 * Contract: enforces the module rule and returns the documented value without changing unrelated state.
 */
export function useReducedMotion(): boolean {
  const fm = useFmReducedMotion();
  if (fm === true) return true;
  if (fm === false) return false;
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}
