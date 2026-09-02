/**
 * Next's production static-file handler does not resolve local image paths
 * containing commas, even when the file exists in the container. Asset names
 * are therefore published without commas; normalize legacy reference data at
 * the rendering boundary as well.
 * Returns: `string`
 */
export function canonicalLocalImageUrl(src: string): string {
  return src.startsWith("/images/") ? src.replace(/,/g, "") : src;
}

export type LocalImageSources = {
  preferred: string;
  fallback: string;
};

/**
 * Resolve local artwork to an AVIF-first source with a PNG compatibility
 * fallback. Remote, data, and blob URLs are left untouched because the site
 * does not own an alternate representation for them.
 */
export function localImageSources(src: string): LocalImageSources {
  const canonical = canonicalLocalImageUrl(src);
  if (!canonical.startsWith("/images/")) {
    return { preferred: canonical, fallback: canonical };
  }

  const match = canonical.match(/^(.*)\.(?:avif|png|jpe?g|webp)([?#].*)?$/i);
  if (!match) {
    return { preferred: canonical, fallback: canonical };
  }

  const [, stem, suffix = ""] = match;
  return {
    preferred: `${stem}.avif${suffix}`,
    fallback: `${stem}.png${suffix}`,
  };
}

/** Apply preferredLocalImageUrl to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * Returns: `string`
 */
export function preferredLocalImageUrl(src: string): string {
  return localImageSources(src).preferred;
}

/** Apply fallbackLocalImageUrl to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * Returns: `string`
 */
export function fallbackLocalImageUrl(src: string): string {
  return localImageSources(src).fallback;
}

/** Champion data owns exact talent asset URLs. Never reconstruct a filename
 * Returns: `string | null`
 * from API display text; punctuation, localization, and historic names differ. */
export function getCanonicalTalentImageUrl(source: string | null | undefined): string | null {
  return source?.startsWith("/images/") ? preferredLocalImageUrl(source) : null;
}
