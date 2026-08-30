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
  "Paladins tier list",
  "Paladins player tracker",
  "Paladins player count",
  "Paladins maps",
  "Paladins items",
  "Paladins talents",
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

export function cleanSeoLabel(value: string, fallback: string, maxLength = 64) {
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || fallback).slice(0, maxLength);
}

export function isPublicPlayerId(value: string) {
  return /^[1-9]\d{0,9}$/.test(value);
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
