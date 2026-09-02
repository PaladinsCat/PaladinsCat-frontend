/** Loads and protects the OIDC client secret boundary.
 * The module owns its existing image, OIDC, proxy, roster, or moderation boundary.
 */
import "server-only";
import { readFileSync } from "node:fs";

/** Apply oidcClientSecret to the declared request or domain inputs.
 * Contract: validates inputs, preserves the existing security or mapping rules, and returns the documented result.
 * Returns: `string | null`
 */
export function oidcClientSecret(): string | null {
  const file = process.env.OIDC_CLIENT_SECRET_FILE;
  const value = file ? readFileSync(file, "utf8") : process.env.OIDC_CLIENT_SECRET;
  return value?.trim() || null;
}
