import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify } from "node:crypto";

export const OIDC_TRANSACTION_TTL_MS = 10 * 60 * 1000;
const RETURN_PATHS = ["/", "/account", "/link-account", "/community", "/builds", "/tierlists", "/players"];
const JWKS_TTL_MS = 5 * 60 * 1000;
const JWKS_REFRESH_COOLDOWN_MS = 30 * 1000;
const JWKS_MAX_BYTES = 128 * 1024;
const jwksCache = new Map<string, { keys: Array<Record<string, unknown>>; expiresAt: number; forcedAt: number }>();

export interface OidcTransaction {
  state: string;
  nonce: string;
  verifier: string;
  returnPath: string;
  issuedAt: number;
}

function b64(bytes: Buffer) { return bytes.toString("base64url"); }
function random(size = 32) { return b64(randomBytes(size)); }
export function newCsrfToken() { return random(); }
function equal(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  const path = value.split("?")[0];
  return RETURN_PATHS.some((allowed) => path === allowed || (allowed !== "/" && path.startsWith(`${allowed}/`))) ? value : "/";
}

export function createTransaction(returnPath: string): OidcTransaction {
  return { state: random(), nonce: random(), verifier: random(48), returnPath: safeReturnPath(returnPath), issuedAt: Date.now() };
}

export function stateMatches(cookieState: string | undefined, callbackState: string | null): boolean {
  return !!cookieState && !!callbackState && equal(cookieState, callbackState);
}

export function parseTransaction(value: unknown): OidcTransaction | null {
  const tx = value as Partial<OidcTransaction> & { return_path?: unknown };
  const returnPath = typeof tx?.returnPath === "string" ? tx.returnPath : tx.return_path;
  if (typeof tx?.state !== "string" || tx.state.length < 32 || tx.state.length > 128 || typeof tx.nonce !== "string" || tx.nonce.length < 32 || typeof tx.verifier !== "string" || tx.verifier.length < 43 || tx.verifier.length > 128 || typeof returnPath !== "string") return null;
  return { state: tx.state, nonce: tx.nonce, verifier: tx.verifier, returnPath: safeReturnPath(returnPath), issuedAt: 0 };
}

export function requireSameOrigin(origin: string | null, publicOrigin: string): boolean {
  return origin === publicOrigin;
}

export function codeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

interface IdTokenClaims { iss?: string; aud?: string | string[]; azp?: string; exp?: number; iat?: number; nonce?: string; }
function decode(part: string): Record<string, unknown> { return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>; }

async function readBoundedJson(response: Response): Promise<{ keys?: Array<Record<string, unknown>> } | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    total += next.value.byteLength;
    if (total > JWKS_MAX_BYTES) { await reader.cancel(); return null; }
    chunks.push(next.value);
  }
  try { return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8")) as { keys?: Array<Record<string, unknown>> }; } catch { return null; }
}

async function fetchJwks(issuer: string): Promise<Array<Record<string, unknown>> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2_000);
  try {
    const response = await fetch(`${issuer.replace(/\/$/, "")}/protocol/openid-connect/certs`, { cache: "no-store", signal: controller.signal });
    if (!response.ok || Number(response.headers.get("content-length") || 0) > JWKS_MAX_BYTES) return null;
    const body = await readBoundedJson(response);
    return body && Array.isArray(body.keys) && body.keys.length <= 32 ? body.keys : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

async function getJwk(issuer: string, kid: string): Promise<Record<string, unknown> | null> {
  const now = Date.now();
  let entry = jwksCache.get(issuer);
  if (!entry || entry.expiresAt <= now) {
    const keys = await fetchJwks(issuer);
    if (!keys) return null;
    entry = { keys, expiresAt: now + JWKS_TTL_MS, forcedAt: 0 };
    jwksCache.set(issuer, entry);
  }
  let key = entry.keys.find((candidate) => candidate.kid === kid && candidate.kty === "RSA" && candidate.use === "sig");
  if (!key && now - entry.forcedAt >= JWKS_REFRESH_COOLDOWN_MS) {
    entry.forcedAt = now;
    const keys = await fetchJwks(issuer);
    if (keys) { entry.keys = keys; entry.expiresAt = now + JWKS_TTL_MS; key = keys.find((candidate) => candidate.kid === kid && candidate.kty === "RSA" && candidate.use === "sig"); }
  }
  return key || null;
}

export function resetJwksCacheForTest() { jwksCache.clear(); }
export async function getJwkForTest(issuer: string, kid: string) { return getJwk(issuer, kid); }

// The issuer is configuration, never read from a token. This intentionally supports only Keycloak's RS256 default.
export async function validateIdToken(idToken: string | undefined, issuer: string, clientId: string, nonce: string): Promise<boolean> {
  if (!idToken) return false;
  const parts = idToken.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = decode(parts[0]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") return false;
    const jwk = await getJwk(issuer, header.kid);
    if (!jwk || !verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk as JsonWebKey, format: "jwk" }), Buffer.from(parts[2], "base64url"))) return false;
    const claims = decode(parts[1]) as IdTokenClaims;
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== issuer || !audience.includes(clientId) || (audience.length > 1 && claims.azp !== clientId) || !claims.exp || claims.exp * 1000 <= Date.now() || !claims.iat || claims.iat * 1000 > Date.now() + 60_000 || !claims.nonce) return false;
    return equal(claims.nonce, nonce);
  } catch { return false; }
}
