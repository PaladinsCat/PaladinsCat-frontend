/** Defines player-review reason labels and formatting.
 * The module preserves the existing validation, storage, formatting, or asset boundary.
 * refs: none
 */
const IMPORTED_ALLEGATIONS_PATTERN = /Imported from supplied confirmed-cheater list\.\s*Allegations:\s*([\s\S]*?)(?=\s*(?:Evidence match IDs:|Source lines?:|Imported from supplied confirmed-cheater list\.)|$)/gi;

/** Apply getCoreCheaterReason to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 * Returns: `string`
 * refs: none
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
