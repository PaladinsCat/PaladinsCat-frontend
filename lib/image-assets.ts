/**
 * Next's production static-file handler does not resolve local image paths
 * containing commas, even when the file exists in the container. Asset names
 * are therefore published without commas; normalize legacy reference data at
 * the rendering boundary as well.
 */
export function canonicalLocalImageUrl(src: string): string {
  return src.startsWith("/images/") ? src.replace(/,/g, "") : src;
}

export function getTalentImageUrl(championName: string, talentName: string, extension = "png"): string {
  return canonicalLocalImageUrl(`/images/champions/Talent ${championName} ${talentName}.${extension}`);
}
