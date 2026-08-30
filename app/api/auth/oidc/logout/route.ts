import { NextRequest, NextResponse } from "next/server";
import { buildRpLogoutUrl, requireSameOrigin } from "@/lib/oidc-security";
export const runtime = "nodejs";
const SESSION_COOKIE = "__Host-pc_session";
const CSRF_COOKIE = "__Host-pc_csrf";
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }
function backend() {
  const base = (process.env.NEXT_SERVER_API_URL || "http://localhost:3005").replace(/\/$/, "");
  return base.endsWith("/v1") ? base : `${base}/v1`;
}
export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) {
    // This opaque legacy-compatible session is read only by the BFF; it is never exposed to browser JavaScript.
    await fetch(`${backend()}/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${session}` }, cache: "no-store" }).catch(() => undefined);
  }
  const centralLogout = buildRpLogoutUrl(process.env.OIDC_ISSUER, process.env.OIDC_CLIENT_ID, process.env.OIDC_POST_LOGOUT_REDIRECT_URI, origin());
  // Missing or unsafe RP-logout configuration still clears local credentials and returns home.
  const response = NextResponse.redirect(centralLogout || new URL("/", origin()), { status: 303 });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, "", { httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
