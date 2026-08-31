/**
 * Define the api auth oidc logout route responsibility boundary.
 * Coordinates api auth oidc logout route data loading, authorization, and presentation.
 */
import { NextRequest, NextResponse } from "next/server";
import { buildRpLogoutUrl, normalizedHttpsIssuer, requireSameOrigin, resolveInternalIssuer } from "@/lib/oidc-security";
import { oidcBffServiceHeaders } from "@/lib/oidc-bff-service";
import { oidcClientSecret } from "@/lib/oidc-client-secret";
/**
 * Selects the Node.js runtime required by this server handler.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export const runtime = "nodejs";
const SESSION_COOKIE = "__Host-pc_session";
const CSRF_COOKIE = "__Host-pc_csrf";
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }
function backend() {
  const base = (process.env.NEXT_SERVER_API_URL || "http://localhost:3005").replace(/\/$/, "");
  return base.endsWith("/v1") ? base : `${base}/v1`;
}
/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  let idTokenHint: string | null = null;
  if (session) {
    // This opaque legacy-compatible session is read only by the BFF; it is never exposed to browser JavaScript.
    // The BFF-only endpoint returns the stored id_token_hint (or nothing for pre-cutover sessions) and is the only path that can read it.
    const hint = await fetch(`${backend()}/auth/oidc/logout`, { method: "POST", headers: { ...await oidcBffServiceHeaders(), "content-type": "application/json" }, body: JSON.stringify({ session_token: session }), cache: "no-store" }).then((response) => (response.ok ? response.json() : null)).catch(() => null) as { id_token_hint?: string; refresh_token?: string } | null;
    if (hint?.id_token_hint && typeof hint.id_token_hint === "string" && hint.id_token_hint.length <= 16_384) idTokenHint = hint.id_token_hint;
    const issuer = normalizedHttpsIssuer(process.env.OIDC_ISSUER);
    const clientId = process.env.OIDC_CLIENT_ID;
    const clientSecret = oidcClientSecret();
    const refreshToken = hint?.refresh_token;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);
    const upstreamLogout = issuer && clientId && clientSecret && typeof refreshToken === "string" && refreshToken.length <= 16_384
      ? fetch(`${resolveInternalIssuer(issuer, process.env.OIDC_INTERNAL_ISSUER)}/protocol/openid-connect/logout`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
          cache: "no-store",
          redirect: "manual",
          signal: controller.signal,
        }).catch(() => undefined)
      : Promise.resolve(undefined);
    await Promise.allSettled([
      upstreamLogout,
      fetch(`${backend()}/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${session}` }, cache: "no-store" }),
    ]);
    clearTimeout(timeout);
  }
  const centralLogout = buildRpLogoutUrl(process.env.OIDC_ISSUER, process.env.OIDC_CLIENT_ID, process.env.OIDC_POST_LOGOUT_REDIRECT_URI, origin(), idTokenHint);
  // Missing or unsafe RP-logout configuration still clears local credentials and returns home.
  const response = NextResponse.redirect(centralLogout || new URL("/", origin()), { status: 303 });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, "", { httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
