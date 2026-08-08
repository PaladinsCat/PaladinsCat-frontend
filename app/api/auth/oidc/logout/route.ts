import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/oidc-security";
export const runtime = "nodejs";
const SESSION_COOKIE = "__Host-pc_session";
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }
function backend() { return process.env.NEXT_SERVER_API_URL || "http://localhost:3005/api"; }
export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) {
    // This opaque legacy-compatible session is read only by the BFF; it is never exposed to browser JavaScript.
    await fetch(`${backend().replace(/\/$/, "")}/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${session}` }, cache: "no-store" }).catch(() => undefined);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
