import { NextRequest, NextResponse } from "next/server";
import { buildParAuthorizationUrl, buildPushedAuthorizationRequest, createTransaction, normalizedHttpsIssuer, parsePushedAuthorizationResponse, requireSameOrigin, resolveInternalIssuer, safeReturnPath } from "@/lib/oidc-security";
import { oidcBffServiceHeaders } from "@/lib/oidc-bff-service";
import { oidcClientSecret } from "@/lib/oidc-client-secret";

export const runtime = "nodejs";
const TX_COOKIE = "__Host-pc_oidc_txn";
const PAR_MAX_BYTES = 8 * 1024;
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }

async function readParResponse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    total += next.value.byteLength;
    if (total > PAR_MAX_BYTES) { await reader.cancel(); return null; }
    chunks.push(next.value);
  }
  try { return parsePushedAuthorizationResponse(JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8"))); } catch { return null; }
}

export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const form = await request.formData();
  const requestedIntent = form.get("intent");
  if (requestedIntent !== null && requestedIntent !== "create") return new NextResponse("Invalid OIDC intent", { status: 400 });
  const intent = requestedIntent === "create" ? "create" : "login";
  const transaction = createTransaction(safeReturnPath(String(form.get("return") || "/")));
  const issuer = normalizedHttpsIssuer(process.env.OIDC_ISSUER);
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = oidcClientSecret();
  if (!issuer || !clientId || !clientSecret) return new NextResponse("OIDC is not configured", { status: 503 });
  const serverIssuer = resolveInternalIssuer(issuer, process.env.OIDC_INTERNAL_ISSUER);
  const stored = await fetch(`${(process.env.NEXT_SERVER_API_URL || "http://localhost:3005/api").replace(/\/$/, "")}/auth/oidc/transactions`, { method: "POST", headers: { ...oidcBffServiceHeaders(), "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ state: transaction.state, nonce: transaction.nonce, verifier: transaction.verifier, return_path: transaction.returnPath }) });
  if (stored.status !== 201) return new NextResponse("OIDC is temporarily unavailable", { status: 503 });
  const par = buildPushedAuthorizationRequest(serverIssuer, clientId, `${origin()}/api/auth/oidc/callback`, transaction);
  par.form.set("client_secret", clientSecret);
  // Registration is a fixed Keycloak prompt, never a browser-supplied auth parameter.
  if (intent === "create") par.form.set("prompt", "create");
  let requestUri: string | undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  try {
    const pushed = await fetch(par.endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, cache: "no-store", redirect: "error", signal: controller.signal, body: par.form });
    const parsed = pushed.ok ? await readParResponse(pushed) : null;
    requestUri = parsed?.requestUri;
  } catch { /* fail closed below */ } finally { clearTimeout(timeout); }
  if (!requestUri) return new NextResponse("OIDC is temporarily unavailable", { status: 503 });
  // A 307 preserves the form POST to Keycloak; use 303 so the authorization endpoint receives a GET.
  const response = NextResponse.redirect(buildParAuthorizationUrl(issuer, clientId, requestUri), { status: 303 });
  response.cookies.set(TX_COOKIE, transaction.state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
