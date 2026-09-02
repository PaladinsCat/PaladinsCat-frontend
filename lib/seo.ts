/**
 * Defines seo's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 * refs: none
 */
export const SITE_URL = "https://paladinscat.com";
/**
 * Defines the  s i t e_ n a m e contract used by this module.
 * refs: none
 */
export const SITE_NAME = "PaladinsCat";

/**
 * Defines the  s e o_ k e y w o r d s contract used by this module.
 * refs: none
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
  "Paladins builds",
  "Paladins loadouts",
  "Paladins ranks",
  "Paladins tier list",
  "Paladins player tracker",
  "Paladins player count",
  "Paladins maps",
  "Paladins items",
  "Paladins talents",
];

/**
 * Defines the absolute url contract used by this module.
 * refs: none
 */
export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Defines the seo title contract used by this module.
 * refs: none
 */
export function seoTitle(title: string) {
  return `${title} | ${SITE_NAME}`;
}

/**
 * Defines the clean description contract used by this module.
 * refs: none
 */
export function cleanDescription(description: string) {
  return description.replace(/\s+/g, " ").trim();
}

/** Normalize user-derived SEO labels and enforce their display bound. · refs: none */
export function cleanSeoLabel(value: string, fallback: string, maxLength = 64) {
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || fallback).slice(0, maxLength);
}

/** Accept only the bounded positive decimal identifiers exposed by public player routes. · refs: none */
export function isPublicPlayerId(value: string) {
  return /^[1-9]\d{0,9}$/.test(value);
}

/** Serialize JSON-LD without allowing a literal tag opener into the HTML payload. · refs: none */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
