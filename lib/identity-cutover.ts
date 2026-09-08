/**
 * This is intentionally build-time configuration. Do not enable it until the
 * production identity canary and legacy-user migration have passed.
 * Returns: `boolean`
 * refs: none
 */
/**
 * Return whether the supplied setting, defaulting to NEXT_PUBLIC_IDENTITY_CUTOVER_ENABLED, is exactly the string true.
 * I/O types: `value: string | undefined -> boolean`.
 * refs: none
 */
export function isIdentityCutoverEnabled(value = process.env.NEXT_PUBLIC_IDENTITY_CUTOVER_ENABLED): boolean {
  return value === "true";
}

/**
 * Capture whether the build-time NEXT_PUBLIC_IDENTITY_CUTOVER_ENABLED setting equals true.
 * refs: none
 */
export const identityCutoverEnabled = isIdentityCutoverEnabled();
