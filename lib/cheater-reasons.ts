/**
 * Trim the reason; for imported confirmed-cheater text, extract and case-insensitively deduplicate allegations in first-seen order. Return the original trimmed text when no imported allegations can be extracted.
 * Defines player-review reason labels and formatting.
 * refs: none
 */
const IMPORTED_ALLEGATIONS_PATTERN = /Imported from supplied confirmed-cheater list\.\s*Allegations:\s*([\s\S]*?)(?=\s*(?:Evidence match IDs:|Source lines?:|Imported from supplied confirmed-cheater list\.)|$)/gi;

/**
 * Trim the reason; for imported confirmed-cheater text, extract and case-insensitively deduplicate allegations in first-seen order. Return the original trimmed text when no imported allegations can be extracted.
 * refs: none
 * I/O types: `reason: string | null | undefined -> string`.
 */
export function getCoreCheaterReason(reason: string | null | undefined): string {
  const value = reason?.trim() ?? "";
  if (!value || !/Imported from supplied confirmed-cheater list\./i.test(value)) return value;

  const seen = new Set<string>();
  const allegations: string[] = [];
  for (const match of value.matchAll(IMPORTED_ALLEGATIONS_PATTERN)) {
    for (const allegation of match[1].split(",")) {
      const cleaned = allegation.trim().replace(/[.;]+$/, "");
      const key = cleaned.toLocaleLowerCase();
      if (cleaned && !seen.has(key)) {
        seen.add(key);
        allegations.push(cleaned);
      }
    }
  }

  return allegations.length > 0 ? allegations.join(", ") : value;
}
