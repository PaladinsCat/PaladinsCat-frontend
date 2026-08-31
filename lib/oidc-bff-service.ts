/** Builds server-side OIDC BFF requests and responses.
 * The module owns its existing image, OIDC, proxy, roster, or moderation boundary.
 */
import "server-only";
import { createPrivateKey, createSign, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

type CachedToken = { value: string; usableUntil: number };
let cached: CachedToken | undefined;
let pending: Promise<string> | undefined;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function clientAssertion(issuer: string, clientId: string, privateKeyFile: string): string {
  const privateKeyBytes = readFileSync(privateKeyFile);
  if (privateKeyBytes.length <= 0 || privateKeyBytes.length > 32 * 1024) {
    throw new Error("Service identity private key is invalid");
  }
  const privateKey = createPrivateKey(privateKeyBytes);
  if (privateKey.asymmetricKeyType !== "rsa" || (privateKey.asymmetricKeyDetails?.modulusLength ?? 0) < 3072) {
    throw new Error("Service identity requires an RSA key of at least 3072 bits");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: clientId,
    sub: clientId,
    aud: issuer,
    iat: now,
    exp: now + 60,
    jti: randomUUID(),
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  signer.end();
  return `${header}.${claims}.${base64Url(signer.sign(privateKey))}`;
}

function validateEndpoints(issuer: string, tokenUrl: string): void {
  const issuerValue = new URL(issuer);
  const tokenValue = new URL(tokenUrl);
  const expectedPath = `${issuerValue.pathname.replace(/\/$/, "")}/protocol/openid-connect/token`;
  const samePublicOrigin = issuerValue.protocol === "https:"
    && tokenValue.protocol === "https:"
    && tokenValue.origin === issuerValue.origin;
  const privateKeycloak = tokenValue.protocol === "http:"
    && tokenValue.hostname === "keycloak"
    && tokenValue.port === "8080";
  if (issuerValue.protocol !== "https:" || !issuerValue.hostname
      || issuerValue.username || issuerValue.password || !/^\/realms\/[^/]+$/.test(issuerValue.pathname)
      || issuerValue.search || issuerValue.hash || tokenValue.username || tokenValue.password
      || tokenValue.pathname !== expectedPath || tokenValue.search || tokenValue.hash
      || (!samePublicOrigin && !privateKeycloak)) {
    throw new Error("Service identity issuer or token URL is invalid");
  }
}

async function boundedJson(response: Response): Promise<Record<string, unknown>> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > 64 * 1024) throw new Error("OIDC token response is too large");
  if (!response.body) throw new Error("OIDC token response is empty");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 64 * 1024) {
      await reader.cancel();
      throw new Error("OIDC token response is too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

async function fetchToken(): Promise<string> {
  const issuer = required("PALADINSCAT_SERVICE_OIDC_ISSUER");
  const tokenUrl = required("PALADINSCAT_SERVICE_OIDC_TOKEN_URL");
  const clientId = required("PALADINSCAT_SERVICE_OIDC_CLIENT_ID");
  const keyFile = required("PALADINSCAT_SERVICE_OIDC_PRIVATE_KEY_FILE");
  validateEndpoints(issuer, tokenUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    redirect: "error",
    signal: controller.signal,
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion(issuer, clientId, keyFile),
    }),
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error("OIDC service authentication failed");
  const body = await boundedJson(response);
  if (body.token_type !== "Bearer" || typeof body.access_token !== "string"
      || body.access_token.length === 0 || body.access_token.length > 16 * 1024) {
    throw new Error("OIDC service authentication returned no access token");
  }
  const expiresIn = typeof body.expires_in === "number" && Number.isFinite(body.expires_in)
    ? body.expires_in : 0;
  if (expiresIn < 31 || expiresIn > 300) throw new Error("OIDC service token lifetime is invalid");
  cached = { value: body.access_token, usableUntil: Date.now() + Math.max(0, expiresIn - 30) * 1000 };
  return body.access_token;
}

async function serviceToken(): Promise<string> {
  if (cached && cached.usableUntil > Date.now()) return cached.value;
  pending ??= fetchToken().finally(() => { pending = undefined; });
  return pending;
}

// Server-only: this credential is minted at runtime and is never available to browser JS.
/** Apply oidcBffServiceHeaders to the declared request or domain inputs.
 * Contract: validates inputs, preserves the existing security or mapping rules, and returns the documented result.
 */
export async function oidcBffServiceHeaders(): Promise<HeadersInit> {
  return { authorization: `Bearer ${await serviceToken()}` };
}
