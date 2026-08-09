/**
 * This is intentionally build-time configuration. Do not enable it until the
 * production identity canary and legacy-user migration have passed.
 */
export function isIdentityCutoverEnabled(value = process.env.NEXT_PUBLIC_IDENTITY_CUTOVER_ENABLED): boolean {
  return value === "true";
}

export const identityCutoverEnabled = isIdentityCutoverEnabled();
