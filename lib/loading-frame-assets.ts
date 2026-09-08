/**
 * Strip tags and diacritics, normalize Unicode/case, replace ampersands with and, remove frame labels and non-alphanumerics, and return the loading-frame lookup key.
 * Resolves loading-frame image assets.
 * refs: none
 */
import manifest from "@/public/images/loading-frames/manifest.json";

/**
 * Define loading frame asset as `(typeof manifest.frames)[number]`.
 * refs: none
 */
export type LoadingFrameAsset = (typeof manifest.frames)[number];

/**
 * Strip tags and diacritics, normalize Unicode/case, replace ampersands with and, remove frame labels and non-alphanumerics, and return the loading-frame lookup key.
 * refs: none
 * I/O types: `value: string -> string`.
 */
export function normalizeLoadingFrameName(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/\bloading\s+frame\b/g, " ")
    .replace(/\bframe\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}

const loadingFramesByName = new Map<string, LoadingFrameAsset>();

for (const frame of manifest.frames) {
  for (const alias of [frame.name, ...frame.aliases]) {
    const key = normalizeLoadingFrameName(alias);
    if (key) loadingFramesByName.set(key, frame);
  }
}

/**
 * Normalize a nonempty loading-frame name and resolve it from the manifest lookup map; return null for empty or unknown names.
 * refs: none
 * I/O types: `value: string | null | undefined -> LoadingFrameAsset | null`.
 */
export function resolveLoadingFrameAsset(value: string | null | undefined): LoadingFrameAsset | null {
  const key = normalizeLoadingFrameName(value?.trim() ?? "");
  return key ? loadingFramesByName.get(key) ?? null : null;
}
