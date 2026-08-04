"use client";

import { useReducedMotion as useFmReducedMotion } from "framer-motion";

export function useReducedMotion(): boolean {
  const fm = useFmReducedMotion();
  if (fm === true) return true;
  if (fm === false) return false;
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}
