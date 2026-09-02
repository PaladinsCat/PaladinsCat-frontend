/**
 * Own small presentation helpers shared across frontend modules.
 *
 * These helpers transform local values only and do not perform network, authentication, or cache work.
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge conditional class values while resolving Tailwind utility conflicts.
 *
 * Accepts inputs; returns a normalized class string with no network, authentication, cache, or persistence effects.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert champion name to URL-safe slug: lowercase, no spaces/special chars  Returns: `string`. */
export function championSlug(name: string | null | undefined): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
