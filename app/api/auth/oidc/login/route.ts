/**
 * Define the api auth oidc login route responsibility boundary.
 * Coordinates api auth oidc login route data loading, authorization, and presentation.
 */
import { NextRequest, NextResponse } from "next/server";
import { buildParAuthorizationUrl, buildPushedAuthorizationRequest, createTransaction, normalizedHttpsIssuer, parsePushedAuthorizationResponse, requireSameOrigin, resolveInternalIssuer, safeReturnPath } from "@/lib/oidc-security";
import { oidcBffServiceHeaders } from "@/lib/oidc-bff-service";
import { oidcClientSecret } from "@/lib/oidc-client-secret";
import { isIP } from "node:net";

/**
 * Selects the Node.js runtime required by this server handler.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export const runtime = "nodejs";
const TX_COOKIE = "__Host-pc_oidc_txn";
const PAR_MAX_BYTES = 8 * 1024;
function origin() { return process.env.PALADINSCAT_PUBLIC_ORIGIN || "http://localhost:3000"; }
function backend() {
  const base = (process.env.NEXT_SERVER_API_URL || "http://localhost:3005").replace(/\/$/, "");
  return base.endsWith("/v1") ? base : `${base}/v1`;
}
function clientAddress(request: NextRequest): string | undefined {
  const address = request.headers.get("cf-connecting-ip")?.trim();
  return address && isIP(address) ? address : undefined;
}

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

async function startOidc(intent: "login" | "create", returnPath: string, clientIp?: string) {
  const transaction = createTransaction(returnPath);
  const issuer = normalizedHttpsIssuer(process.env.OIDC_ISSUER);
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = oidcClientSecret();
  if (!issuer || !clientId || !clientSecret) return new NextResponse("OIDC is not configured", { status: 503 });
  const serverIssuer = resolveInternalIssuer(issuer, process.env.OIDC_INTERNAL_ISSUER);
  const stored = await fetch(`${backend()}/auth/oidc/transactions`, { method: "POST", headers: { ...await oidcBffServiceHeaders(), ...(clientIp ? { "x-forwarded-for": clientIp } : {}), "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ state: transaction.state, nonce: transaction.nonce, verifier: transaction.verifier, return_path: transaction.returnPath }) });
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

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export async function POST(request: NextRequest) {
  if (!requireSameOrigin(request.headers.get("origin"), origin())) return new NextResponse("Forbidden", { status: 403 });
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType && contentType !== "application/x-www-form-urlencoded" && contentType !== "multipart/form-data") return new NextResponse("Unsupported media type", { status: 415 });
  let form: FormData;
  try { form = contentType ? await request.formData() : new FormData(); }
  catch { return new NextResponse("Invalid form", { status: 400 }); }
  const requestedIntent = form.get("intent");
  if (requestedIntent !== null && requestedIntent !== "create") return new NextResponse("Invalid OIDC intent", { status: 400 });
  return startOidc(requestedIntent === "create" ? "create" : "login", safeReturnPath(String(form.get("return") || "/")), clientAddress(request));
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export async function GET(request: NextRequest) {
  const entries = [...request.nextUrl.searchParams.entries()];
  if (entries.length === 0) return startOidc("login", "/", clientAddress(request));
  if (entries.length === 1 && entries[0][0] === "return") return startOidc("login", safeReturnPath(entries[0][1]), clientAddress(request));
  if (entries.length === 1 && entries[0][0] === "intent" && entries[0][1] === "create") return startOidc("create", "/", clientAddress(request));
  return new NextResponse("Not found", { status: 404 });
}
