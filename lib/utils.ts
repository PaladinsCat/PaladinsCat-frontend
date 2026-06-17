import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert champion name to URL-safe slug: lowercase, no spaces/special chars */
export function championSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}
