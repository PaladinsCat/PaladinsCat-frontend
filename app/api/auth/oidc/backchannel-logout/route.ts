import { NextRequest, NextResponse } from "next/server";
import { normalizedHttpsIssuer, resolveInternalIssuer, validateLogoutToken } from "@/lib/oidc-security";
import { oidcBffServiceHeaders } from "@/lib/oidc-bff-service";

export const runtime = "nodejs";
function backend() { return process.env.NEXT_SERVER_API_URL || "http://localhost:3005/api"; }

// Keycloak POSTs a form-encoded logout_token (RS256, typ=Logout) here on backchannel logout.
// This route verifies the token server-side, then calls the service-token-protected backend
// revocation route. It is never a browser-facing page and returns no user data.
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
  const revoke = await fetch(`${backend().replace(/\/$/, "")}/auth/oidc/backchannel-logout`, {
    method: "POST",
    headers: { ...oidcBffServiceHeaders(), "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ jti: claims.jti, oidc_session_id: claims.sid }),
  }).catch(() => undefined);
  // The browser receives an opaque success; the session row is already revoked by the backend.
  return new NextResponse(null, { status: revoke && revoke.ok ? 204 : 502 });
}