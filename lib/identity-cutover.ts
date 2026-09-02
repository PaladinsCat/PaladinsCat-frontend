/**
 * This is intentionally build-time configuration. Do not enable it until the
 * production identity canary and legacy-user migration have passed.
 * Returns: `boolean`
 */
export function isIdentityCutoverEnabled(value = process.env.NEXT_PUBLIC_IDENTITY_CUTOVER_ENABLED): boolean {
  return value === "true";
}

/** Apply identityCutoverEnabled to the declared input values.
 * Contract: returns the module-specific validated, stored, formatted, or resolved value without external side effects.
 */
export const identityCutoverEnabled = isIdentityCutoverEnabled();
