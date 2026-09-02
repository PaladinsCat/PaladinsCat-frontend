/**
 * Defines oidc-security's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 * refs: none
 */
import { createHash, createPublicKey, randomBytes, timingSafeEqual, verify, type JsonWebKey as NodeJsonWebKey } from "node:crypto";

/**
 * Defines the  o i d c_ t r a n s a c t i o n_ t t l_ m s contract used by this module.
 * refs: none
 */
export const OIDC_TRANSACTION_TTL_MS = 10 * 60 * 1000;
const RETURN_PATHS = ["/", "/account", "/link-account", "/community", "/builds", "/tierlists", "/players"];
const JWKS_TTL_MS = 5 * 60 * 1000;
const JWKS_REFRESH_COOLDOWN_MS = 30 * 1000;
const JWKS_MAX_BYTES = 128 * 1024;
const jwksCache = new Map<string, { keys: Array<Record<string, unknown>>; expiresAt: number; forcedAt: number }>();

/**
 * Defines the  oidc transaction contract used by this module.
 * refs: none
 */
export interface OidcTransaction {
  state: string;
  nonce: string;
  verifier: string;
  returnPath: string;
  issuedAt: number;
}

function b64(bytes: Buffer) { return bytes.toString("base64url"); }
function random(size = 32) { return b64(randomBytes(size)); }
/**
 * Defines the new csrf token contract used by this module.
 * refs: none
 */
export function newCsrfToken() { return random(); }
function equal(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Defines the safe return path contract used by this module.
 * Returns: `string`
 * refs: none
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  const path = value.split("?")[0];
  return RETURN_PATHS.some((allowed) => path === allowed || (allowed !== "/" && path.startsWith(`${allowed}/`))) ? value : "/";
}

/**
 * Performs the create transaction operation with this module's boundary checks.
 * Returns: `object`
 * refs: none
 */
export function createTransaction(returnPath: string): OidcTransaction {
  return { state: random(), nonce: random(), verifier: random(48), returnPath: safeReturnPath(returnPath), issuedAt: Date.now() };
}

/**
 * Defines the state matches contract used by this module.
 * Returns: `boolean`
 * refs: none
 */
export function stateMatches(cookieState: string | undefined, callbackState: string | null): boolean {
  return !!cookieState && !!callbackState && equal(cookieState, callbackState);
}

/**
 * Returns: `null`
 * Transforms or validates parse transaction according to this module's data contract.
 * refs: none
 */
export function parseTransaction(value: unknown): OidcTransaction | null {
  const tx = value as Partial<OidcTransaction> & { return_path?: unknown };
  const returnPath = typeof tx?.returnPath === "string" ? tx.returnPath : tx.return_path;
  if (typeof tx?.state !== "string" || tx.state.length < 32 || tx.state.length > 128 || typeof tx.nonce !== "string" || tx.nonce.length < 32 || typeof tx.verifier !== "string" || tx.verifier.length < 43 || tx.verifier.length > 128 || typeof returnPath !== "string") return null;
  return { state: tx.state, nonce: tx.nonce, verifier: tx.verifier, returnPath: safeReturnPath(returnPath), issuedAt: 0 };
}

/**
 * Performs the require same origin operation with this module's boundary checks.
 * Returns: `boolean`
 * refs: none
 */
export function requireSameOrigin(origin: string | null, publicOrigin: string): boolean {
  return origin === publicOrigin;
}

/**
 * Performs the code challenge operation with this module's boundary checks.
 * Returns: `string`
 * refs: none
 */
export function codeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Transforms or validates normalized https issuer according to this module's data contract.
 * Returns: `string | null`
 * refs: none
 */
export function normalizedHttpsIssuer(issuer: string | undefined): string | null {
  if (!issuer) return null;
  try {
    const url = new URL(issuer);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname === "/") return null;
    return url.toString().replace(/\/$/, "");
  } catch { return null; }
}

// The destination is derived solely from the configured realm issuer.
/**
 * Defines the keycloak account url contract used by this module.
 * refs: none
 */
export function keycloakAccountUrl(issuer: string | undefined): URL | null {
  const normalized = normalizedHttpsIssuer(issuer);
  return normalized ? new URL(`${normalized}/account/`) : null;
}

/**
 * Transforms or validates resolve internal issuer according to this module's data contract.
 * Returns: `string`
 * refs: none
 */
export function resolveInternalIssuer(issuer: string, override: string | undefined): string {
  const external = new URL(issuer);
  if (!override) return issuer;
  try {
    const candidate = new URL(override);
    const internal = new URL(`http://keycloak:8080${external.pathname}`);
    return candidate.href === internal.href ? internal.toString().replace(/\/$/, "") : issuer;
  } catch { return issuer; }
}

/**
 * Performs the build pushed authorization request operation with this module's boundary checks.
 * refs: none
 */
export function buildPushedAuthorizationRequest(serverIssuer: string, clientId: string, redirectUri: string, transaction: OidcTransaction): { endpoint: URL; form: URLSearchParams } {
  const endpoint = new URL(`${serverIssuer.replace(/\/$/, "")}/protocol/openid-connect/ext/par/request`);
  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("response_type", "code");
  form.set("scope", "openid profile email");
  form.set("redirect_uri", redirectUri);
  form.set("state", transaction.state);
  form.set("nonce", transaction.nonce);
  form.set("code_challenge_method", "S256");
  form.set("code_challenge", codeChallenge(transaction.verifier));
  return { endpoint, form };
}

/**
 * Performs the build par authorization url operation with this module's boundary checks.
 * refs: none
 */
export function buildParAuthorizationUrl(issuer: string, clientId: string, requestUri: string): URL {
  const authorization = new URL(`${issuer.replace(/\/$/, "")}/protocol/openid-connect/auth`);
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("request_uri", requestUri);
  return authorization;
}

/**
 * Transforms or validates parse pushed authorization response according to this module's data contract.
 * refs: none
 */
export function parsePushedAuthorizationResponse(value: unknown): { requestUri: string; expiresIn: number } | null {
  const response = value as { request_uri?: unknown; expires_in?: unknown };
  if (typeof response?.request_uri !== "string" || !/^urn:ietf:params:oauth:request_uri:[A-Za-z0-9._~-]+$/.test(response.request_uri)) return null;
  if (!Number.isSafeInteger(response.expires_in) || (response.expires_in as number) < 1 || (response.expires_in as number) > 600) return null;
  return { requestUri: response.request_uri, expiresIn: response.expires_in as number };
}

/**
 * Performs the build rp logout url operation with this module's boundary checks.
 * refs: none
 */
export function buildRpLogoutUrl(issuer: string | undefined, clientId: string | undefined, postLogoutRedirectUri: string | undefined, publicOrigin: string, idTokenHint?: string | null): URL | null {
  if (!issuer || !clientId || !postLogoutRedirectUri) return null;
  try {
    const issuerUrl = new URL(issuer);
    const redirect = new URL(postLogoutRedirectUri);
    if (issuerUrl.protocol !== "https:" || redirect.origin !== new URL(publicOrigin).origin) return null;
    const logout = new URL(`${issuer.replace(/\/$/, "")}/protocol/openid-connect/logout`);
    logout.searchParams.set("client_id", clientId);
    logout.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    // id_token_hint names the upstream SSO session to terminate; absent for
    // pre-cutover sessions that have no stored hint (cookie-fallback behavior).
    if (idTokenHint && idTokenHint.length <= 16_384) logout.searchParams.set("id_token_hint", idTokenHint);
    return logout;
  } catch { return null; }
}

/**
 * Transforms or validates valid id token header according to this module's data contract.
 * Returns: `boolean`
 * refs: none
 */
export function validIdTokenHeader(header: Record<string, unknown>): boolean {
  return header.alg === "RS256" && typeof header.kid === "string" && (header.typ === undefined || header.typ === "ID" || header.typ === "JWT");
}

interface IdTokenClaims { iss?: string; aud?: string | string[]; azp?: string; exp?: number; iat?: number; nonce?: string; pc_keep_signed_in?: boolean; }
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

/**
 * Defines the reset jwks cache for test contract used by this module.
 * refs: none
 */
export function resetJwksCacheForTest() { jwksCache.clear(); }
/**
 * Reads jwk for test from the module's configured source.
 * refs: none
 */
export async function getJwkForTest(issuer: string, kid: string) { return getJwk(issuer, kid); }

// The issuer is configuration, never read from a token. This intentionally supports only Keycloak's RS256 default.
/**
 * Transforms or validates validate id token according to this module's data contract.
 * Returns: `Promise<IdTokenClaims | null>`
 * refs: none
 */
export async function validateIdToken(idToken: string | undefined, issuer: string, clientId: string, nonce: string, jwksIssuer = issuer): Promise<IdTokenClaims | null> {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = decode(parts[0]);
    if (!validIdTokenHeader(header)) return null;
    const jwk = await getJwk(jwksIssuer, header.kid as string);
    if (!jwk || !verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk as NodeJsonWebKey, format: "jwk" }), Buffer.from(parts[2], "base64url"))) return null;
    const claims = decode(parts[1]) as IdTokenClaims;
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== issuer || !audience.includes(clientId) || (audience.length > 1 && claims.azp !== clientId) || !claims.exp || claims.exp * 1000 <= Date.now() || !claims.iat || claims.iat * 1000 > Date.now() + 60_000 || !claims.nonce) return null;
    return equal(claims.nonce, nonce) ? claims : null;
  } catch { return null; }
}

// Backchannel logout tokens are Keycloak-issued, RS256, typ=Logout or logout+jwt (Keycloak 26.x). The issuer is configuration, never read from a token.
/**
 * Defines the  logout token claims contract used by this module.
 * refs: none
 */
export interface LogoutTokenClaims { jti: string; sid: string | null; }
/**
 * Transforms or validates valid logout token header according to this module's data contract.
 * Returns: `boolean`
 * refs: none
 */
export function validLogoutTokenHeader(header: Record<string, unknown>): boolean {
  return header.alg === "RS256" && typeof header.kid === "string" && (header.typ === "Logout" || header.typ === "logout+jwt");
}

/**
 * Transforms or validates validate logout token according to this module's data contract.
 * Returns: `Promise<LogoutTokenClaims | null>`
 * refs: none
 */
export async function validateLogoutToken(logoutToken: string, issuer: string, clientId: string, jwksIssuer = issuer): Promise<LogoutTokenClaims | null> {
  const parts = logoutToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = decode(parts[0]);
    if (!validLogoutTokenHeader(header)) return null;
    const jwk = await getJwk(jwksIssuer, header.kid as string);
    if (!jwk || !verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk as NodeJsonWebKey, format: "jwk" }), Buffer.from(parts[2], "base64url"))) return null;
    const claims = decode(parts[1]) as { iss?: string; aud?: string | string[]; exp?: number; iat?: number; jti?: string; sid?: string; events?: Record<string, unknown> };
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== issuer || !audience.includes(clientId) || !claims.exp || claims.exp * 1000 <= Date.now() || !claims.iat || claims.iat * 1000 > Date.now() + 60_000 || claims.events?.["http://schemas.openid.net/event/backchannel-logout"] === undefined && claims.events?.["backchannel-logout"] !== true || typeof claims.jti !== "string" || claims.jti.length === 0) return null;
    return { jti: claims.jti, sid: typeof claims.sid === "string" && claims.sid.length > 0 ? claims.sid : null };
  } catch { return null; }
}
