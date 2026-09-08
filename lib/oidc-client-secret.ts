/**
 * Read the configured secret file when present, otherwise use OIDC_CLIENT_SECRET; trim whitespace and return null for an empty or missing value. File read errors propagate.
 * Loads and protects the OIDC client secret boundary.
 * refs: none
 */
import "server-only";
import { readFileSync } from "node:fs";

/**
 * Read the configured secret file when present, otherwise use OIDC_CLIENT_SECRET; trim whitespace and return null for an empty or missing value. File read errors propagate.
 * refs: none
 * I/O types: `none -> string | null`.
 */
export function oidcClientSecret(): string | null {
  const file = process.env.OIDC_CLIENT_SECRET_FILE;
  const value = file ? readFileSync(file, "utf8") : process.env.OIDC_CLIENT_SECRET;
  return value?.trim() || null;
}
