/**
 * Exchange a single authorization code after matching the transaction cookie and consuming server-side state. Validate the ID token and nonce, exchange tokens with the backend, and set session and CSRF cookies before redirecting to the safe return path. Validation failures clear the transaction cookie and redirect to the login error page; uncaught transport/JSON errors reject the promise. Provider tokens stay server-side.
 * refs: none
 */
import { NextRequest, NextResponse } from "next/server";
import { newCsrfToken, normalizedHttpsIssuer, safeReturnPath, parseTransaction, resolveInternalIssuer, stateMatches, validateIdToken } from "@/lib/oidc-security";
import { oidcBffServiceHeaders, type CfForwardHeaders } from "@/lib/oidc-bff-service";
import { oidcClientSecret } from "@/lib/oidc-client-secret";
import { FP_COOKIE, parseFingerprintCookie } from "@/lib/fingerprint";

/**
 * Selects the Node.js runtime required by this server handler.
 * Returns: `string`
 * refs: none
 */
export const runtime = "nodejs";
const TX_COOKIE = "__Host-pc_oidc_txn";
const SESSION_COOKIE = "__Host-pc_session";
const CSRF_COOKIE = "__Host-pc_csrf";
// Dedicated Pro surface. Invitation-active accounts are handed off here on login (see GET).
const PRO_ORIGIN = "https://pro.paladinscat.com";
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }
function backend() {
  const base = (process.env.NEXT_SERVER_API_URL || "http://localhost:3005").replace(/\/$/, "");
  return base.endsWith("/v1") ? base : `${base}/v1`;
}
function clear(response: NextResponse) { response.cookies.set(TX_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 }); }
function one(url: URL, name: string): string | null {
  const values = url.searchParams.getAll(name);
  return values.length === 1 ? values[0] : null;
}
// Server-side invitation check for the just-established session. Returns true only when the
// backend confirms an active invitation for this token; any transport/parse error fails open
// (false) so a transient backend hiccup never strands a login on the Pro hand-off.
async function invitationActive(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${backend()}/auth/account/invitation`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return false;
    const body = await response.json() as { active?: boolean };
    return body.active === true;
  } catch {
    return false;
  }
}
// Forward the Cloudflare edge headers (cf-connecting-ip, cf-ray) plus the bounded browser
// inputs to the backend for security-event logging. user-agent/accept-language come from the
// request headers; screen/timezone/platform come from the first-party pc_fp cookie because a
// top-level navigation (from the IdP) cannot carry custom request headers. No other browser
// data crosses this boundary; the backend hashes the IP and the browser signature and the
// frontend never stores or logs the raw value.
function cfForwardHeaders(request: NextRequest): CfForwardHeaders {
  const headers: CfForwardHeaders = {};
  const connectingIp = request.headers.get("cf-connecting-ip")?.trim();
  const ray = request.headers.get("cf-ray")?.trim();
  const userAgent = request.headers.get("user-agent")?.trim();
  const acceptLanguage = request.headers.get("accept-language")?.trim();
  if (connectingIp) headers["cf-connecting-ip"] = connectingIp;
  if (ray) headers["cf-ray"] = ray;
  if (userAgent) headers["user-agent"] = userAgent;
  if (acceptLanguage) headers["accept-language"] = acceptLanguage;
  const fp = parseFingerprintCookie(request.cookies.get(FP_COOKIE)?.value);
  if (fp.screen) headers["x-paladinscat-fp-screen"] = fp.screen;
  if (fp.timezone) headers["x-paladinscat-fp-timezone"] = fp.timezone;
  if (fp.platform) headers["x-paladinscat-fp-platform"] = fp.platform;
  return headers;
}

/**
 * Exchange a single authorization code after matching the transaction cookie and consuming server-side state. Validate the ID token and nonce, exchange tokens with the backend, and set session and CSRF cookies before redirecting to the safe return path. Validation failures clear the transaction cookie and redirect to the login error page; uncaught transport/JSON errors reject the promise. Provider tokens stay server-side.
 * refs: doc: documents/02-technical/security/auth.md
 * I/O types: `request: NextRequest -> Promise<NextResponse<unknown>>`.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = one(url, "state");
  const code = one(url, "code");
  if (!stateMatches(request.cookies.get(TX_COOKIE)?.value, state) || !code || url.searchParams.get("error")) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const consume = await fetch(`${backend()}/auth/oidc/transactions/consume`, { method: "POST", headers: { ...await oidcBffServiceHeaders(), "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ state }) });
  if (!consume.ok) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const txValue = await consume.json();
  const tx = parseTransaction(txValue);
  if (!tx) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const issuer = normalizedHttpsIssuer(process.env.OIDC_ISSUER);
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = oidcClientSecret();
  if (!issuer || !clientId || !clientSecret) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const serverIssuer = resolveInternalIssuer(issuer, process.env.OIDC_INTERNAL_ISSUER);
  const tokenResponse = await fetch(`${serverIssuer}/protocol/openid-connect/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, cache: "no-store", body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, code_verifier: tx.verifier, redirect_uri: `${origin()}/api/auth/oidc/callback` }) });
  if (!tokenResponse.ok) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const token = await tokenResponse.json() as { access_token?: string; id_token?: string; refresh_token?: string };
  const idClaims = await validateIdToken(token.id_token, issuer, clientId, tx.nonce, serverIssuer);
  if (!token.access_token || !token.id_token || !token.refresh_token || !idClaims) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  // Access tokens cross this server-to-server boundary only; they never reach browser JS or cookies.
  const keepSignedIn = idClaims.pc_keep_signed_in === true;
  // The validated id_token crosses this server-to-server boundary only; the backend stores it (encrypted) so RP-initiated logout can name the SSO session via id_token_hint.
  const exchangeBody: { access_token: string; id_token: string; refresh_token: string; session_ttl_hours?: number } = { access_token: token.access_token, id_token: token.id_token, refresh_token: token.refresh_token };
  if (keepSignedIn) exchangeBody.session_ttl_hours = 72;
  const exchange = await fetch(`${backend()}/auth/oidc/exchange`, { method: "POST", headers: { ...await oidcBffServiceHeaders(cfForwardHeaders(request)), "content-type": "application/json" }, cache: "no-store", body: JSON.stringify(exchangeBody) });
  if (!exchange.ok) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const result = await exchange.json() as { token?: string; expires_at?: string };
  if (!result.token || result.token.length > 512 || !result.expires_at) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const expiresMs = Date.parse(result.expires_at);
  const sessionMaxAge = Number.isFinite(expiresMs) ? Math.floor((expiresMs - Date.now()) / 1000) : 60 * 60 * 8;
  if (sessionMaxAge <= 0) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const returnPath = safeReturnPath(tx.returnPath);
  // Invitation-active accounts belong on the dedicated Pro surface. Hand them off to Pro's
  // OIDC login (not a bare page redirect): the session cookie is host-scoped, so a bare
  // cross-origin redirect would land them on Pro without a session. Base and Pro share the
  // same OIDC client, so the fresh Keycloak SSO session makes this a silent login that
  // establishes the Pro session, and the validated return path is preserved. The origin
  // guard makes this a no-op when the callback already runs on Pro (no loop).
  const currentOrigin = origin().replace(/\/$/, "");
  if (currentOrigin !== PRO_ORIGIN && await invitationActive(result.token)) {
    const proLogin = new URL("/api/auth/oidc/login", PRO_ORIGIN);
    proLogin.searchParams.set("return", returnPath);
    return NextResponse.redirect(proLogin);
  }
  const response = NextResponse.redirect(new URL(returnPath, origin()));
  clear(response);
  response.cookies.set(SESSION_COOKIE, result.token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: sessionMaxAge });
  // Deliberately readable by same-origin JS only; backend requires it to match X-CSRF-Token on unsafe cookie-auth requests.
  response.cookies.set(CSRF_COOKIE, newCsrfToken(), { httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: sessionMaxAge });
  return response;
}
