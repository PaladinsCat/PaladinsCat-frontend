import { NextRequest, NextResponse } from "next/server";
import { newCsrfToken, safeReturnPath, parseTransaction, stateMatches, validateIdToken } from "@/lib/oidc-security";
import { oidcBffServiceHeaders } from "@/lib/oidc-bff-service";
import { oidcClientSecret } from "@/lib/oidc-client-secret";

export const runtime = "nodejs";
const TX_COOKIE = "__Host-pc_oidc_txn";
const SESSION_COOKIE = "__Host-pc_session";
const CSRF_COOKIE = "__Host-pc_csrf";
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }
function backend() { return process.env.NEXT_SERVER_API_URL || "http://localhost:3005/api"; }
function clear(response: NextResponse) { response.cookies.set(TX_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 }); }
function one(url: URL, name: string): string | null {
  const values = url.searchParams.getAll(name);
  return values.length === 1 ? values[0] : null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = one(url, "state");
  const code = one(url, "code");
  if (!stateMatches(request.cookies.get(TX_COOKIE)?.value, state) || !code || url.searchParams.get("error")) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const consume = await fetch(`${backend().replace(/\/$/, "")}/auth/oidc/transactions/consume`, { method: "POST", headers: { ...oidcBffServiceHeaders(), "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ state }) });
  if (!consume.ok) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const txValue = await consume.json();
  const tx = parseTransaction(txValue);
  if (!tx) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const issuer = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = oidcClientSecret();
  if (!issuer || !clientId || !clientSecret) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const tokenResponse = await fetch(`${issuer.replace(/\/$/, "")}/protocol/openid-connect/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, cache: "no-store", body: new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code, code_verifier: tx.verifier, redirect_uri: `${origin()}/api/auth/oidc/callback` }) });
  if (!tokenResponse.ok) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const token = await tokenResponse.json() as { access_token?: string; id_token?: string };
  if (!token.access_token || !await validateIdToken(token.id_token, issuer, clientId, tx.nonce)) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  // Access tokens cross this server-to-server boundary only; they never reach browser JS or cookies.
  const exchange = await fetch(`${backend().replace(/\/$/, "")}/auth/oidc/exchange`, { method: "POST", headers: { ...oidcBffServiceHeaders(), "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ access_token: token.access_token }) });
  if (!exchange.ok) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const result = await exchange.json() as { token?: string; expires_at?: string };
  if (!result.token || result.token.length > 512) { const response = NextResponse.redirect(new URL("/auth/login?oidc_error=1", origin())); clear(response); return response; }
  const response = NextResponse.redirect(new URL(safeReturnPath(tx.returnPath), origin()));
  clear(response);
  response.cookies.set(SESSION_COOKIE, result.token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  // Deliberately readable by same-origin JS only; backend requires it to match X-CSRF-Token on unsafe cookie-auth requests.
  response.cookies.set(CSRF_COOKIE, newCsrfToken(), { httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 8 });
  return response;
}
