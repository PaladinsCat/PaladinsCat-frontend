/**
 * Next's production static-file handler does not resolve local image paths
 * containing commas, even when the file exists in the container. Asset names
 * are therefore published without commas; normalize legacy reference data at
 * the rendering boundary as well.
 */
export function canonicalLocalImageUrl(src: string): string {
  return src.startsWith("/images/") ? src.replace(/,/g, "") : src;
}

/** Champion data owns exact talent asset URLs. Never reconstruct a filename
 * from API display text; punctuation, localization, and historic names differ. */
export function getCanonicalTalentImageUrl(source: string | null | undefined): string | null {
  return source?.startsWith("/images/") ? canonicalLocalImageUrl(source) : null;
}
