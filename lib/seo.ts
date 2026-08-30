export const SITE_URL = "https://paladinscat.com";
export const SITE_NAME = "PaladinsCat";

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
  "Paladins player count",
];

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function seoTitle(title: string) {
  return `${title} | ${SITE_NAME}`;
}

export function cleanDescription(description: string) {
  return description.replace(/\s+/g, " ").trim();
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
