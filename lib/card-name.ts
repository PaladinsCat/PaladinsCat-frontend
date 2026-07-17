/**
 * Match feeds and reference snapshots occasionally disagree on harmless card
 * name details (for example, "Honed Sense" vs "Honed Senses"). Use this key
 * only as a fallback after exact ID/name matching so canonical IDs remain the
 * primary identity and display text is never rewritten.
 */
export function canonicalCardNameKey(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bguerrilla\b/g, "guerilla")
    .replace(/\b([a-z0-9]{3,})s\b/g, "$1")
    .replace(/\s+/g, "");
}
