/**
 * Define the api auth oidc account route responsibility boundary.
 * Coordinates api auth oidc account route data loading, authorization, and presentation.
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
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Response>`
 * refs: none
 */
export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const account = keycloakAccountUrl(process.env.OIDC_ISSUER);
  if (!account) return new NextResponse("OIDC is not configured", { status: 503 });
  return NextResponse.redirect(account, { status: 303 });
}
