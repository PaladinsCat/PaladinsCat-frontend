import { createHash, createHmac, createPublicKey, randomBytes, timingSafeEqual, verify } from "node:crypto";

export const OIDC_TRANSACTION_TTL_MS = 10 * 60 * 1000;
const RETURN_PATHS = ["/", "/account", "/link-account", "/community", "/builds", "/tierlists", "/players"];

export interface OidcTransaction {
  state: string;
  nonce: string;
  verifier: string;
  returnPath: string;
  issuedAt: number;
}

function b64(bytes: Buffer) { return bytes.toString("base64url"); }
function secret() {
  const value = process.env.OIDC_TRANSACTION_SECRET;
  if (!value || value.length < 32) throw new Error("OIDC_TRANSACTION_SECRET must be at least 32 characters");
  return value;
}
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
function random(size = 32) { return b64(randomBytes(size)); }
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

export function createTransaction(returnPath: string): { transaction: OidcTransaction; signed: string } {
  const transaction = { state: random(), nonce: random(), verifier: random(48), returnPath: safeReturnPath(returnPath), issuedAt: Date.now() };
  const payload = b64(Buffer.from(JSON.stringify(transaction)));
  return { transaction, signed: `${payload}.${sign(payload)}` };
}

export function readTransaction(value: string | undefined, state: string | null): OidcTransaction | null {
  if (!value || !state) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra || !equal(signature, sign(payload))) return null;
  try {
    const tx = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OidcTransaction;
    if (!tx.state || !tx.nonce || !tx.verifier || !Number.isFinite(tx.issuedAt) || Date.now() - tx.issuedAt > OIDC_TRANSACTION_TTL_MS) return null;
    return equal(tx.state, state) ? tx : null;
  } catch { return null; }
}

export function requireSameOrigin(origin: string | null, publicOrigin: string): boolean {
  return origin === publicOrigin;
}

export function codeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

interface IdTokenClaims { iss?: string; aud?: string | string[]; azp?: string; exp?: number; iat?: number; nonce?: string; }
function decode(part: string): Record<string, unknown> { return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>; }

// The issuer is configuration, never read from a token. This intentionally supports only Keycloak's RS256 default.
export async function validateIdToken(idToken: string | undefined, issuer: string, clientId: string, nonce: string): Promise<boolean> {
  if (!idToken) return false;
  const parts = idToken.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = decode(parts[0]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") return false;
    const keysResponse = await fetch(`${issuer.replace(/\/$/, "")}/protocol/openid-connect/certs`, { cache: "no-store" });
    if (!keysResponse.ok) return false;
    const keys = await keysResponse.json() as { keys?: Array<Record<string, unknown>> };
    const jwk = keys.keys?.find((key) => key.kid === header.kid && key.kty === "RSA" && key.use === "sig");
    if (!jwk || !verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk as JsonWebKey, format: "jwk" }), Buffer.from(parts[2], "base64url"))) return false;
    const claims = decode(parts[1]) as IdTokenClaims;
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== issuer || !audience.includes(clientId) || (audience.length > 1 && claims.azp !== clientId) || !claims.exp || claims.exp * 1000 <= Date.now() || !claims.iat || claims.iat * 1000 > Date.now() + 60_000 || !claims.nonce) return false;
    return equal(claims.nonce, nonce);
  } catch { return false; }
}
