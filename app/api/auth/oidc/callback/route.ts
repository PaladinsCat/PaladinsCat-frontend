/**
 * Define the api auth oidc callback route responsibility boundary.
 * Coordinates api auth oidc callback route data loading, authorization, and presentation.
 * refs: none
 */
import { NextRequest, NextResponse } from "next/server";
import { newCsrfToken, normalizedHttpsIssuer, safeReturnPath, parseTransaction, resolveInternalIssuer, stateMatches, validateIdToken } from "@/lib/oidc-security";
import { oidcBffServiceHeaders } from "@/lib/oidc-bff-service";
import { oidcClientSecret } from "@/lib/oidc-client-secret";

/**
 * Selects the Node.js runtime required by this server handler.
 * Returns: `string`
 * refs: none
 */
export const runtime = "nodejs";
const TX_COOKIE = "__Host-pc_oidc_txn";
const SESSION_COOKIE = "__Host-pc_session";
const CSRF_COOKIE = "__Host-pc_csrf";
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

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 * refs: none
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
  const exchange = await fetch(`${backend()}/auth/oidc/exchange`, { method: "POST", headers: { ...await oidcBffServiceHeaders(), "content-type": "application/json" }, cache: "no-store", body: JSON.stringify(exchangeBody) });
  if (!exchange.ok) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const result = await exchange.json() as { token?: string; expires_at?: string };
  if (!result.token || result.token.length > 512 || !result.expires_at) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const expiresMs = Date.parse(result.expires_at);
  const sessionMaxAge = Number.isFinite(expiresMs) ? Math.floor((expiresMs - Date.now()) / 1000) : 60 * 60 * 8;
  if (sessionMaxAge <= 0) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const response = NextResponse.redirect(new URL(safeReturnPath(tx.returnPath), origin()));
  clear(response);
  response.cookies.set(SESSION_COOKIE, result.token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: sessionMaxAge });
  // Deliberately readable by same-origin JS only; backend requires it to match X-CSRF-Token on unsafe cookie-auth requests.
  response.cookies.set(CSRF_COOKIE, newCsrfToken(), { httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: sessionMaxAge });
  return response;
}
