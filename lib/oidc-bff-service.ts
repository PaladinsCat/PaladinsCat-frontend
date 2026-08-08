import "server-only";
import { readFileSync } from "node:fs";

function tokenValue(): string {
  const file = process.env.PALADINSCAT_OIDC_BFF_SERVICE_TOKEN_FILE;
  const value = file ? readFileSync(file, "utf8") : process.env.PALADINSCAT_OIDC_BFF_SERVICE_TOKEN;
  const token = value?.trim();
  if (!token || token.length < 32) throw new Error("PALADINSCAT_OIDC_BFF_SERVICE_TOKEN must be at least 32 characters");
  return token;
}

// Keep this module server-only: the service credential authorizes BFF-to-backend calls and must never be bundled.
export function oidcBffServiceHeaders(): HeadersInit {
  return { authorization: `Bearer ${tokenValue()}` };
}
