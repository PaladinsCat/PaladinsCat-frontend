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
 * Generate a cryptographically random base64url CSRF token.
 * refs: none
 * I/O types: `none -> string`.
 */
export function newCsrfToken() { return random(); }
function equal(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Retain a leading-slash path only when it matches an allowed route or its subpath. Reject missing paths, protocol-relative // paths, and backslashes with /; preserve query text on an allowed destination.
 * refs: none
 * I/O types: `value: string | null | undefined -> string`.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  const path = value.split("?")[0];
  return RETURN_PATHS.some((allowed) => path === allowed || (allowed !== "/" && path.startsWith(`${allowed}/`))) ? value : "/";
}

/**
 * Generate independent random state, nonce, and a 48-byte PKCE verifier; sanitize the return path and record the current millisecond timestamp.
 * refs: none
 * I/O types: `returnPath: string -> OidcTransaction`.
 */
export function createTransaction(returnPath: string): OidcTransaction {
  return { state: random(), nonce: random(), verifier: random(48), returnPath: safeReturnPath(returnPath), issuedAt: Date.now() };
}

/**
 * Return false for missing state values or different byte lengths; otherwise compare the cookie and callback state using timingSafeEqual.
 * refs: none
 * I/O types: `cookieState: string | undefined; callbackState: string | null -> boolean`.
 */
export function stateMatches(cookieState: string | undefined, callbackState: string | null): boolean {
  return !!cookieState && !!callbackState && equal(cookieState, callbackState);
}

/**
 * Validate transaction state (32-128 characters), nonce (at least 32), verifier (43-128), and a string return path. Accept camelCase or snake_case return paths, sanitize the path, set issuedAt to zero, and return null for malformed data.
 * refs: none
 * I/O types: `value: unknown -> OidcTransaction | null`.
 */
export function parseTransaction(value: unknown): OidcTransaction | null {
  const tx = value as Partial<OidcTransaction> & { return_path?: unknown };
  const returnPath = typeof tx?.returnPath === "string" ? tx.returnPath : tx.return_path;
  if (typeof tx?.state !== "string" || tx.state.length < 32 || tx.state.length > 128 || typeof tx.nonce !== "string" || tx.nonce.length < 32 || typeof tx.verifier !== "string" || tx.verifier.length < 43 || tx.verifier.length > 128 || typeof returnPath !== "string") return null;
  return { state: tx.state, nonce: tx.nonce, verifier: tx.verifier, returnPath: safeReturnPath(returnPath), issuedAt: 0 };
}

/**
 * Return whether the Origin string exactly equals the configured public-origin string; perform no URL normalization.
 * refs: none
 * I/O types: `origin: string | null; publicOrigin: string -> boolean`.
 */
export function requireSameOrigin(origin: string | null, publicOrigin: string): boolean {
  return origin === publicOrigin;
}

/**
 * Hash the verifier with SHA-256 and encode the digest as base64url for a PKCE S256 challenge.
 * refs: none
 * I/O types: `verifier: string -> string`.
 */
export function codeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Parse an issuer URL and require HTTPS, a non-root realm path, and no credentials/query/fragment. Remove its trailing slash or return null for absent or invalid input.
 * refs: none
 * I/O types: `issuer: string | undefined -> string | null`.
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
 * Build the account-console URL beneath a validated HTTPS realm issuer; return null for absent or invalid issuer configuration.
 * refs: none
 * I/O types: `issuer: string | undefined -> URL | null`.
 */
export function keycloakAccountUrl(issuer: string | undefined): URL | null {
  const normalized = normalizedHttpsIssuer(issuer);
  return normalized ? new URL(`${normalized}/account/`) : null;
}

/**
 * Use an override only when it exactly matches http://keycloak:8080 plus the external issuer pathname; otherwise retain the external issuer. An invalid external issuer throws during URL parsing.
 * refs: none
 * I/O types: `issuer: string; override: string | undefined -> string`.
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
 * Build the Keycloak PAR endpoint and form containing client ID, code response type, openid/profile/email scopes, redirect URI, state, nonce, and the S256 PKCE challenge. Perform no HTTP request; invalid URL construction throws.
 * refs: none
 * I/O types: `serverIssuer: string; clientId: string; redirectUri: string; transaction: OidcTransaction -> { endpoint: URL; form: URLSearchParams }`.
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
 * Build the realm authorization URL with only client_id and the accepted PAR request_uri; perform no HTTP request and propagate invalid URL errors.
 * refs: none
 * I/O types: `issuer: string; clientId: string; requestUri: string -> URL`.
 */
export function buildParAuthorizationUrl(issuer: string, clientId: string, requestUri: string): URL {
  const authorization = new URL(`${issuer.replace(/\/$/, "")}/protocol/openid-connect/auth`);
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("request_uri", requestUri);
  return authorization;
}

/**
 * Accept an OAuth request_uri URN with the supported safe suffix and a safe-integer expiry from 1 to 600 seconds; normalize field names or return null.
 * refs: none
 * I/O types: `value: unknown -> { requestUri: string; expiresIn: number } | null`.
 */
export function parsePushedAuthorizationResponse(value: unknown): { requestUri: string; expiresIn: number } | null {
  const response = value as { request_uri?: unknown; expires_in?: unknown };
  if (typeof response?.request_uri !== "string" || !/^urn:ietf:params:oauth:request_uri:[A-Za-z0-9._~-]+$/.test(response.request_uri)) return null;
  if (!Number.isSafeInteger(response.expires_in) || (response.expires_in as number) < 1 || (response.expires_in as number) > 600) return null;
  return { requestUri: response.request_uri, expiresIn: response.expires_in as number };
}

/**
 * Build the realm logout URL only with configured issuer/client/redirect, an HTTPS issuer, and a redirect origin matching publicOrigin. Add client_id and post_logout_redirect_uri plus a nonempty ID-token hint of at most 16,384 characters; return null for invalid configuration or URL parsing.
 * refs: none
 * I/O types: `issuer: string | undefined; clientId: string | undefined; postLogoutRedirectUri: string | undefined; publicOrigin: string; idTokenHint?: string | null -> URL | null`.
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
 * Require RS256 and a string kid, with typ absent, ID, or JWT.
 * refs: none
 * I/O types: `header: Record<string, unknown> -> boolean`.
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
 * Clear the in-memory JWKS cache so a subsequent lookup fetches keys again.
 * refs: none
 * I/O types: `none -> void`.
 */
export function resetJwksCacheForTest() { jwksCache.clear(); }
/**
 * Resolve an RSA signing JWK by issuer and kid through the normal cache/refresh path, returning null when no matching key can be obtained.
 * refs: none
 * I/O types: `issuer: string; kid: string -> Promise<Record<string, unknown> | null>`.
 */
export async function getJwkForTest(issuer: string, kid: string) { return getJwk(issuer, kid); }

// The issuer is configuration, never read from a token. This intentionally supports only Keycloak's RS256 default.
/**
 * Verify a three-part ID token with RS256 and the kid-selected JWKS key (fetching/caching keys through getJwk). Require exact issuer, client audience, matching azp for multiple audiences, unexpired exp, iat no more than 60 seconds in the future, and constant-time nonce equality. Return validated claims or null on missing input, failed validation, parsing/crypto errors, or JWKS failure.
 * refs: none
 * I/O types: `idToken: string | undefined; issuer: string; clientId: string; nonce: string; jwksIssuer: string -> Promise<IdTokenClaims | null>`.
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
 * Require RS256, a string kid, and Logout or logout+jwt typ for a backchannel logout token.
 * refs: none
 * I/O types: `header: Record<string, unknown> -> boolean`.
 */
export function validLogoutTokenHeader(header: Record<string, unknown>): boolean {
  return header.alg === "RS256" && typeof header.kid === "string" && (header.typ === "Logout" || header.typ === "logout+jwt");
}

/**
 * Verify the three-part logout token with its RS256 kid-selected JWKS key. Require issuer/client audience, unexpired exp, iat at most 60 seconds ahead, the supported backchannel-logout event, and nonempty jti; return jti plus an optional nonempty sid or null on validation, parse, crypto, or JWKS failure.
 * refs: none
 * I/O types: `logoutToken: string; issuer: string; clientId: string; jwksIssuer: string -> Promise<LogoutTokenClaims | null>`.
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
