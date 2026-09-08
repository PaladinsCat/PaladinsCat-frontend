/**
 * Reject cross-origin requests with 403 and missing account configuration with 503; otherwise return a 303 redirect to the configured Keycloak account console.
 * refs: none
 */
import { NextRequest, NextResponse } from "next/server";
import { keycloakAccountUrl, requireSameOrigin } from "@/lib/oidc-security";

/**
 * Selects the Node.js runtime required by this server handler.
 * Returns: `string`
 * refs: none
 */
export const runtime = "nodejs";
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }

/**
 * Reject cross-origin requests with 403 and missing account configuration with 503; otherwise return a 303 redirect to the configured Keycloak account console.
 * refs: doc: documents/02-technical/security/auth.md
 * I/O types: `request: NextRequest -> Promise<NextResponse<unknown>>`.
 */
export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const account = keycloakAccountUrl(process.env.OIDC_ISSUER);
  if (!account) return new NextResponse("OIDC is not configured", { status: 503 });
  return NextResponse.redirect(account, { status: 303 });
}
