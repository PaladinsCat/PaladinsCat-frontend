import test from "node:test";
import assert from "node:assert/strict";
import { buildParAuthorizationUrl, buildPushedAuthorizationRequest, buildRpLogoutUrl, createTransaction, getJwkForTest, keycloakAccountUrl, normalizedHttpsIssuer, parsePushedAuthorizationResponse, requireSameOrigin, resetJwksCacheForTest, resolveInternalIssuer, safeReturnPath, stateMatches, validIdTokenHeader } from "./oidc-security.ts";
import { csrfHeader } from "./csrf.ts";
import { isIdentityCutoverEnabled } from "./identity-cutover.ts";
import { readFileSync } from "node:fs";

test("rejects open redirects", () => {
  for (const path of ["https://evil.example", "//evil.example", "/%5c%5cevil.example", "/admin", "/auth/login"]) assert.equal(safeReturnPath(path), "/");
  assert.equal(safeReturnPath("/players/42?tab=builds"), "/players/42?tab=builds");
});
test("state transaction binds callback and rejects replay after cookie clear", () => {
  const transaction = createTransaction("/account");
  assert.equal(stateMatches(transaction.state, transaction.state), true);
  assert.equal(stateMatches(transaction.state, "replayed-or-wrong-state"), false);
  assert.equal(stateMatches(undefined, transaction.state), false);
});
test("unsafe requests require exact origin", () => {
  assert.equal(requireSameOrigin("https://paladinscat.com", "https://paladinscat.com"), true);
  assert.equal(requireSameOrigin("https://evil.example", "https://paladinscat.com"), false);
  assert.equal(requireSameOrigin(null, "https://paladinscat.com"), false);
});
test("OIDC issuer is a query-free HTTPS realm URL", () => {
  assert.equal(normalizedHttpsIssuer("https://auth.paladinscat.com/realms/paladinscat/"), "https://auth.paladinscat.com/realms/paladinscat");
  for (const value of [undefined, "http://auth.paladinscat.com/realms/paladinscat", "https://auth.paladinscat.com/", "https://auth.paladinscat.com/realms/paladinscat?x=1"]) assert.equal(normalizedHttpsIssuer(value), null);
});
test("account console is derived only from the configured realm issuer", () => {
  assert.equal(keycloakAccountUrl("https://auth.paladinscat.com/realms/paladinscat/")?.href, "https://auth.paladinscat.com/realms/paladinscat/account/");
  assert.equal(keycloakAccountUrl("http://auth.paladinscat.com/realms/paladinscat"), null);
});
test("JWKS outage and oversized documents fail closed", async () => {
  resetJwksCacheForTest();
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("offline", { status: 503 });
  assert.equal(await getJwkForTest("https://auth.example", "one"), null);
  globalThis.fetch = async () => new Response("x", { headers: { "content-length": "999999" } });
  assert.equal(await getJwkForTest("https://auth.example", "one"), null);
  globalThis.fetch = original;
});
test("unknown kid forces only one bounded refresh", async () => {
  resetJwksCacheForTest();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ keys: [{ kid: "known", kty: "RSA", use: "sig" }] })); };
  assert.ok(await getJwkForTest("https://auth.example", "known"));
  for (let i = 0; i < 20; i++) assert.equal(await getJwkForTest("https://auth.example", `unknown-${i}`), null);
  assert.equal(calls, 2);
  globalThis.fetch = original;
});
test("cookie-auth CSRF header is required only for unsafe requests", () => {
  assert.equal(csrfHeader("__Host-pc_csrf=csrf-value", "POST"), "csrf-value");
  assert.equal(csrfHeader("other=value", "POST"), null);
  assert.equal(csrfHeader("__Host-pc_csrf=csrf-value", "GET"), null);
});
test("BFF credential is server-only and never a public environment value", () => {
  const source = readFileSync(new URL("./oidc-bff-service.ts", import.meta.url), "utf8");
  assert.match(source, /import "server-only"/);
  assert.match(source, /PALADINSCAT_OIDC_BFF_SERVICE_TOKEN_FILE/);
  assert.doesNotMatch(source, /NEXT_PUBLIC/);
});
test("OIDC client secret is loaded server-side from a secret file when configured", () => {
  const source = readFileSync(new URL("./oidc-client-secret.ts", import.meta.url), "utf8");
  assert.match(source, /import "server-only"/);
  assert.match(source, /OIDC_CLIENT_SECRET_FILE/);
  assert.doesNotMatch(source, /NEXT_PUBLIC/);
});
test("RP logout uses only the exact configured same-origin return URI", () => {
  const logout = buildRpLogoutUrl("https://auth.paladinscat.com/realms/paladinscat", "paladinscat-web", "https://paladinscat.com/auth/login", "https://paladinscat.com");
  assert.equal(logout?.origin, "https://auth.paladinscat.com");
  assert.equal(logout?.searchParams.get("post_logout_redirect_uri"), "https://paladinscat.com/auth/login");
  assert.equal(logout?.searchParams.get("client_id"), "paladinscat-web");
  assert.equal([...logout!.searchParams.keys()].sort().join(","), "client_id,post_logout_redirect_uri");
  assert.equal(buildRpLogoutUrl("https://auth.paladinscat.com/realms/paladinscat", "paladinscat-web", "https://evil.example/logout", "https://paladinscat.com"), null);
});
test("authorization parameters are pushed server-side and the browser gets only PAR identifiers", () => {
  const transaction = createTransaction("/");
  const pushed = buildPushedAuthorizationRequest("https://auth.paladinscat.com/realms/paladinscat", "paladinscat-web", "https://paladinscat.com/api/auth/oidc/callback", transaction);
  assert.equal(pushed.endpoint.pathname, "/realms/paladinscat/protocol/openid-connect/ext/par/request");
  assert.equal(pushed.form.get("state"), transaction.state);
  assert.equal(pushed.form.get("nonce"), transaction.nonce);
  assert.equal(pushed.form.get("code_challenge_method"), "S256");
  const authorization = buildParAuthorizationUrl("https://auth.paladinscat.com/realms/paladinscat", "paladinscat-web", "urn:ietf:params:oauth:request_uri:opaque");
  assert.equal(authorization.search, "?client_id=paladinscat-web&request_uri=urn%3Aietf%3Aparams%3Aoauth%3Arequest_uri%3Aopaque");
  assert.equal(authorization.searchParams.get("state"), null);
  assert.equal(authorization.searchParams.get("code_challenge"), null);
});
test("server issuer override permits only Keycloak's exact internal realm", () => {
  const issuer = "https://auth.paladinscat.com/realms/paladinscat";
  assert.equal(resolveInternalIssuer(issuer, "http://keycloak:8080/realms/paladinscat"), "http://keycloak:8080/realms/paladinscat");
  for (const value of [undefined, "http://keycloak:8080/realms/other", "http://backend-rust-api:3005/realms/paladinscat", "https://evil.example/realms/paladinscat"]) assert.equal(resolveInternalIssuer(issuer, value), issuer);
});
test("PAR response requires a bounded-lived opaque request URI", () => {
  assert.deepEqual(parsePushedAuthorizationResponse({ request_uri: "urn:ietf:params:oauth:request_uri:abc_DEF-123", expires_in: 60 }), { requestUri: "urn:ietf:params:oauth:request_uri:abc_DEF-123", expiresIn: 60 });
  for (const value of [{ request_uri: "https://evil.example", expires_in: 60 }, { request_uri: "urn:ietf:params:oauth:request_uri:ok", expires_in: 0 }, { request_uri: "urn:ietf:params:oauth:request_uri:ok", expires_in: 601 }]) assert.equal(parsePushedAuthorizationResponse(value), null);
});
test("OIDC login redirects the initiating POST with 303, never 307", () => {
  const source = readFileSync(new URL("../app/api/auth/oidc/login/route.ts", import.meta.url), "utf8");
  assert.match(source, /NextResponse\.redirect\(buildParAuthorizationUrl\(issuer, clientId, requestUri\), \{ status: 303 \}\)/);
});
test("identity cutover is explicit: default keeps legacy credentials and only true enables Keycloak-only pages", () => {
  const login = readFileSync(new URL("../app/auth/login/page.tsx", import.meta.url), "utf8");
  const register = readFileSync(new URL("../app/auth/register/route.ts", import.meta.url), "utf8");
  const account = readFileSync(new URL("../app/account/page.tsx", import.meta.url), "utf8");
  const accountRoute = readFileSync(new URL("../app/api/auth/oidc/account/route.ts", import.meta.url), "utf8");
  const apiClient = readFileSync(new URL("./api-client.ts", import.meta.url), "utf8");
  assert.equal(isIdentityCutoverEnabled(undefined), false);
  assert.equal(isIdentityCutoverEnabled("false"), false);
  assert.equal(isIdentityCutoverEnabled("true"), true);
  assert.match(login, /identityCutoverEnabled/);
  assert.doesNotMatch(register, /identityCutoverEnabled|LegacyRegistration|await register\(/);
  assert.match(login, /useAuth\(\)/);
  assert.match(apiClient, /"\/auth\/login"/);
  assert.match(apiClient, /"\/auth\/register"/);
  assert.match(login, /action="\/api\/auth\/oidc\/login" method="post"/);
  assert.match(login, /<OidcLoginForm returnPath=\{redirectPath\} \/>/);
  assert.match(login, /generated\.auth\.oidc\.divider/);
  assert.match(register, /NextResponse\.redirect\(new URL\("\/api\/auth\/oidc\/login\?intent=create", request\.url\), 307\)/);
  assert.match(account, /action="\/api\/auth\/oidc\/account" method="post"/);
  assert.match(account, /if \(authLoading\) return/);
  assert.match(accountRoute, /requireSameOrigin/);
  assert.match(accountRoute, /keycloakAccountUrl\(process\.env\.OIDC_ISSUER\)/);
});
test("transitional OIDC cookie sessions can load account data and terminate centrally", () => {
  const apiClient = readFileSync(new URL("./api-client.ts", import.meta.url), "utf8");
  assert.match(apiClient, /function accountAuthHeaders\(\)/);
  assert.match(apiClient, /headers: accountAuthHeaders\(\)/);
  const adminDashboard = readFileSync(new URL("./admin-dashboard-api.ts", import.meta.url), "utf8");
  assert.doesNotMatch(adminDashboard, /if \(!token\).*sessionRequired/);
  assert.match(apiClient, /startsWith\("__Host-pc_csrf="\)/);
  assert.match(apiClient, /identityCutoverEnabled \|\| hasOidcCookieSession/);
  assert.match(apiClient, /form\.action = "\/api\/auth\/oidc\/logout"/);
});
test("only the fixed create intent can add the Keycloak registration prompt", () => {
  const route = readFileSync(new URL("../app/api/auth/oidc/login/route.ts", import.meta.url), "utf8");
  assert.match(route, /requestedIntent !== null && requestedIntent !== "create"/);
  assert.match(route, /if \(intent === "create"\) par\.form\.set\("prompt", "create"\)/);
  assert.match(route, /entries\.length !== 1.*entries\[0\]\[0\] !== "intent".*entries\[0\]\[1\] !== "create"/);
  assert.match(route, /return startOidc\("create", "\/"\)/);
});
test("frontend server calls use the pinned internal issuer without changing token issuer validation", () => {
  const login = readFileSync(new URL("../app/api/auth/oidc/login/route.ts", import.meta.url), "utf8");
  const callback = readFileSync(new URL("../app/api/auth/oidc/callback/route.ts", import.meta.url), "utf8");
  assert.match(login, /resolveInternalIssuer\(issuer, process\.env\.OIDC_INTERNAL_ISSUER\)/);
  assert.match(callback, /fetch\(`\$\{serverIssuer\}\/protocol\/openid-connect\/token`/);
  assert.match(callback, /validateIdToken\(token\.id_token, issuer, clientId, tx\.nonce, serverIssuer\)/);
});
test("ID token typ accepts proven Keycloak and standard forms only", () => {
  assert.equal(validIdTokenHeader({ alg: "RS256", kid: "one", typ: "ID" }), true);
  assert.equal(validIdTokenHeader({ alg: "RS256", kid: "one", typ: "JWT" }), true);
  assert.equal(validIdTokenHeader({ alg: "RS256", kid: "one" }), true);
  assert.equal(validIdTokenHeader({ alg: "RS256", kid: "one", typ: "at+jwt" }), false);
});
