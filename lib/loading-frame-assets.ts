import manifest from "@/public/images/loading-frames/manifest.json";

export type LoadingFrameAsset = (typeof manifest.frames)[number];

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

export function resolveLoadingFrameAsset(value: string | null | undefined): LoadingFrameAsset | null {
  const key = normalizeLoadingFrameName(value?.trim() ?? "");
  return key ? loadingFramesByName.get(key) ?? null : null;
}
