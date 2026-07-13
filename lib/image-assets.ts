/**
 * Next's production static-file handler does not resolve local image paths
 * containing commas, even when the file exists in the container. Asset names
 * are therefore published without commas; normalize legacy reference data at
 * the rendering boundary as well.
 */
export function canonicalLocalImageUrl(src: string): string {
  return src.startsWith("/images/") ? src.replace(/,/g, "") : src;
}

/** Asset filenames use the official uppercase spelling, while API/reference
 * data occasionally title-cases it as "Vii". Keep this mapping at the image
 * boundary so every consumer resolves the same local file. */
export function canonicalChampionAssetName(name: string): string {
  return name.trim().toLowerCase() === "vii" ? "VII" : name.trim();
}

export function getTalentImageUrl(championName: string, talentName: string, extension = "png"): string {
  return canonicalLocalImageUrl(`/images/champions/Talent ${canonicalChampionAssetName(championName)} ${talentName}.${extension}`);
}

export function getCanonicalTalentImageUrl(source: string | null | undefined, championName: string, talentName: string): string {
  // Champion data is the source of truth for talent artwork. Some talents
  // intentionally keep art under a historic or punctuation-sensitive name,
  // so rebuilding the path from the display name can point at a non-existent
  // file (for example Goddess's Blessing).
  if (source?.startsWith("/images/")) return canonicalLocalImageUrl(source);
  const extension = source?.match(/\.([a-z0-9]+)(?:[?#].*)?$/i)?.[1] ?? "avif";
  return getTalentImageUrl(championName, talentName, extension);
}
