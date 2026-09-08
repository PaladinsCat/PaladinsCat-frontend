/**
 * Validate the form logout token against the configured issuer and client before forwarding it to backend session revocation. Return 503 for missing configuration, 400 for malformed or missing form data, 401 for invalid tokens, 204 on successful revocation, or 502 when backend revocation fails.
 * refs: none
 */
import { NextRequest, NextResponse } from "next/server";
import { normalizedHttpsIssuer, resolveInternalIssuer, validateLogoutToken } from "@/lib/oidc-security";
import { oidcBffServiceHeaders } from "@/lib/oidc-bff-service";

/**
 * Selects the Node.js runtime required by this server handler.
 * Returns: `string`
 * refs: none
 */
export const runtime = "nodejs";
function backend() {
  const base = (process.env.NEXT_SERVER_API_URL || "http://localhost:3005").replace(/\/$/, "");
  return base.endsWith("/v1") ? base : `${base}/v1`;
}

// Keycloak POSTs a form-encoded logout_token (RS256, typ=Logout) here on backchannel logout.
// This route verifies the token server-side, then calls the service-token-protected backend
// revocation route. It is never a browser-facing page and returns no user data.
/**
 * Validate the form logout token against the configured issuer and client before forwarding it to backend session revocation. Return 503 for missing configuration, 400 for malformed or missing form data, 401 for invalid tokens, 204 on successful revocation, or 502 when backend revocation fails.
 * refs: doc: documents/02-technical/security/auth.md
 * I/O types: `request: NextRequest -> Promise<NextResponse<unknown>>`.
 */
export async function POST(request: NextRequest) {
  const issuer = normalizedHttpsIssuer(process.env.OIDC_ISSUER);
  const clientId = process.env.OIDC_CLIENT_ID;
  if (!issuer || !clientId) return new NextResponse("OIDC is not configured", { status: 503 });
  const serverIssuer = resolveInternalIssuer(issuer, process.env.OIDC_INTERNAL_ISSUER);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new NextResponse("Invalid logout request", { status: 400 });
  }
  const logoutToken = form.get("logout_token");
  if (typeof logoutToken !== "string" || logoutToken.length === 0 || logoutToken.length > 16_384) {
    return new NextResponse("Missing logout token", { status: 400 });
  }
  const claims = await validateLogoutToken(logoutToken, issuer, clientId, serverIssuer);
  if (!claims || !claims.sid) return new NextResponse("Invalid logout token", { status: 401 });
  // Forward the raw logout_token form-encoded. The backend (Form binding) is the
  // authority: it re-validates signature/issuer/audience, applies jti replay
  // protection, and revokes the session row bound to the token's sid.
  const revoke = await fetch(`${backend()}/auth/oidc/backchannel-logout`, {
    method: "POST",
    headers: { ...await oidcBffServiceHeaders(), "content-type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    body: new URLSearchParams({ logout_token: logoutToken }),
  }).catch(() => undefined);
  // The browser receives an opaque success; the session row is already revoked by the backend.
  return new NextResponse(null, { status: revoke && revoke.ok ? 204 : 502 });
}
