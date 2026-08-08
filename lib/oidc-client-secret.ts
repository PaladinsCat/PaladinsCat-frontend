import "server-only";
import { readFileSync } from "node:fs";

export function oidcClientSecret(): string | null {
  const file = process.env.OIDC_CLIENT_SECRET_FILE;
  const value = file ? readFileSync(file, "utf8") : process.env.OIDC_CLIENT_SECRET;
  return value?.trim() || null;
}
