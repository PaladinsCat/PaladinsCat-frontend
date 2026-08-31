/**
 * Defines seo's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 */
export const SITE_URL = "https://paladinscat.com";
/**
 * Defines the  s i t e_ n a m e contract used by this module.
 */
export const SITE_NAME = "PaladinsCat";

/**
 * Defines the  s e o_ k e y w o r d s contract used by this module.
 */
export const SEO_KEYWORDS = [
  "Paladins",
  "Paladins stats",
  "Paladins data",
  "Paladins ranked stats",
  "Paladins champion stats",
  "Paladins leaderboard",
  "Paladins match history",
  "Paladins meta",
  "Paladins win rate",
  "Paladins ELO",
  "Paladins Glicko",
];

/**
 * Defines the absolute url contract used by this module.
 */
export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Defines the seo title contract used by this module.
 */
export function seoTitle(title: string) {
  return `${title} | ${SITE_NAME}`;
}

/**
 * Defines the clean description contract used by this module.
 */
export function cleanDescription(description: string) {
  return description.replace(/\s+/g, " ").trim();
}
