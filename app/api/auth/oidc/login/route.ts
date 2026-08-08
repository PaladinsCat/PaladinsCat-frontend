import { NextRequest, NextResponse } from "next/server";
import { codeChallenge, createTransaction, requireSameOrigin, safeReturnPath } from "@/lib/oidc-security";

export const runtime = "nodejs";
const TX_COOKIE = "__Host-pc_oidc_txn";
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }

export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  const { transaction, signed } = createTransaction(safeReturnPath(String(form.get("return") || "/")));
  const issuer = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  if (!issuer || !clientId) return new NextResponse("OIDC is not configured", { status: 503 });
  const authorization = new URL(`${issuer.replace(/\/$/, "")}/protocol/openid-connect/auth`);
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", "openid profile email");
  authorization.searchParams.set("redirect_uri", `${origin()}/api/auth/oidc/callback`);
  authorization.searchParams.set("state", transaction.state);
  authorization.searchParams.set("nonce", transaction.nonce);
  authorization.searchParams.set("code_challenge_method", "S256");
  authorization.searchParams.set("code_challenge", codeChallenge(transaction.verifier));
  const response = NextResponse.redirect(authorization);
  response.cookies.set(TX_COOKIE, signed, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
