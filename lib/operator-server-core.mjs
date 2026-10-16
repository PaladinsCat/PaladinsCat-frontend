/** HTTPS ingress and bounded API proxy for the private operator BFF. */
import { createServer } from "node:https";
import { createHash, createPrivateKey, randomUUID } from "node:crypto";
import { assertOperatorConfiguration, isOperatorBff, operatorApiSuffix, operatorPathAllowed } from "./operator-plane.ts";
import { operatorBackendFetch, parseOperatorCertificates, readOperatorMaterial } from "./operator-transport.mjs";

export function createOperatorServer(handle, fetchBackend = operatorBackendFetch) {
if (!isOperatorBff()) throw new Error("Operator mode is required");
assertOperatorConfiguration();
const origin = new URL(process.env.PALADINSCAT_OPERATOR_ORIGIN);
const ca = readOperatorMaterial("PALADINSCAT_OPERATOR_TLS_CA_FILE");
parseOperatorCertificates(ca, true);
const cert = readOperatorMaterial("PALADINSCAT_OPERATOR_TLS_CERT_FILE");
const key = readOperatorMaterial("PALADINSCAT_OPERATOR_TLS_KEY_FILE");
const leaf = parseOperatorCertificates(cert, false);
if (leaf.length !== 1 || !leaf[0].checkPrivateKey(createPrivateKey(key))
    || !leaf[0].checkHost("frontend-operator")
    || !leaf[0].keyUsage?.includes("1.3.6.1.5.5.7.3.1")) throw new Error("Invalid operator server identity");

function approvedPeer(socket) {
  if (!socket.authorized) return false;
  const raw = socket.getPeerCertificate()?.raw;
  if (!raw) return false;
  // Re-read the public allowlist for safe old/new certificate overlap.
  const approved = parseOperatorCertificates(readOperatorMaterial("PALADINSCAT_OPERATOR_TLS_CLIENT_CERTS_FILE"), false);
  const digest = createHash("sha256").update(raw).digest("hex");
  return approved.some(value => createHash("sha256").update(value.raw).digest("hex") === digest);
}

function fail(res, status, code) {
  if (res.headersSent) { res.destroy(); return; }
  res.writeHead(status, { "content-type": "application/json", "cache-control": "private, no-store" });
  res.end(JSON.stringify({ error: { code } }));
}

let active = 0;
async function proxyApi(req, res, url, suffix) {
  if (active >= 4) { fail(res, 503, "OPERATOR_BUSY"); return; }
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (unsafe && req.headers.origin !== origin.origin) { fail(res, 403, "ORIGIN_REJECTED"); return; }
  if (req.headers["content-length"] && (!/^\d+$/.test(req.headers["content-length"]) || Number(req.headers["content-length"]) > 131072)) {
    fail(res, 413, "REQUEST_TOO_LARGE"); return;
  }
  active++;
  const controller = new AbortController();
  const abort = () => { if (!res.writableFinished) controller.abort(); };
  req.once("aborted", abort); res.once("close", abort);
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 131072) { fail(res, 413, "REQUEST_TOO_LARGE"); return; }
      chunks.push(chunk);
    }
    const headers = new Headers({ "accept": "application/json", "x-forwarded-proto": "https", "x-request-id": randomUUID() });
    for (const name of ["authorization", "origin", "content-type", "x-csrf-token", "user-agent"]) {
      if (typeof req.headers[name] === "string") headers.set(name, req.headers[name]);
    }
    const cookies = (req.headers.cookie || "").split(";").map(value => value.trim())
      .filter(value => value.startsWith("__Host-pc_admin_session=") || value.startsWith("__Host-pc_csrf="));
    if (cookies.length) headers.set("cookie", cookies.join("; "));
    const target = new URL(`/v1${suffix}`, process.env.NEXT_SERVER_API_URL);
    target.search = url.search;
    const upstream = await fetchBackend(target, { method: req.method, headers,
      ...(unsafe && size ? { body: Buffer.concat(chunks) } : {}),
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
    });
    // Complete the bounded response before forwarding status; never forward a truncated success.
    const body = []; let received = 0;
    if (upstream.body) {
      const reader = upstream.body.getReader();
      for (;;) {
        const part = await reader.read(); if (part.done) break;
        received += part.value.length;
        const limit = /^\/cheaters\/evidence\/[1-9][0-9]{0,18}\/(file|media\/[0-9]{1,3})$/.test(suffix) ? 16777216 : 8388608;
        if (received > limit) { await reader.cancel(); throw new Error("Operator response exceeded limit"); }
        body.push(Buffer.from(part.value));
      }
    }
    const resultHeaders = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
    for (const name of ["content-type", "retry-after", "x-request-id"]) {
      const value = upstream.headers.get(name); if (value) resultHeaders[name] = value;
    }
    res.writeHead(upstream.status, resultHeaders);
    res.end(Buffer.concat(body));
  } catch { fail(res, 502, "OPERATOR_UPSTREAM_UNAVAILABLE"); }
  finally { active--; req.removeListener("aborted", abort); res.removeListener("close", abort); }
}

const server = createServer({ key, cert, ca, requestCert: true, rejectUnauthorized: true, minVersion: "TLSv1.3", maxHeaderSize: 16384 }, async (req, res) => {
  try {
    if (!approvedPeer(req.socket)) { fail(res, 403, "GATEWAY_REJECTED"); return; }
    if (req.headers.host !== origin.host || !req.url?.startsWith("/") || req.url.startsWith("//")) { fail(res, 400, "INVALID_ORIGIN"); return; }
    const rawPath = req.url.split("?", 1)[0];
    if (rawPath.includes("%") || rawPath.includes("\\") || rawPath.includes("//") || rawPath.split("/").some(value => value === "." || value === "..")) {
      fail(res, 400, "NON_CANONICAL_PATH"); return;
    }
    const url = new URL(req.url, origin);
    if (!operatorPathAllowed(url.pathname, req.method)) { fail(res, 404, "NOT_FOUND"); return; }
    const suffix = operatorApiSuffix(url.pathname, req.method);
    if (suffix) await proxyApi(req, res, url, suffix);
    else await handle(req, res);
  } catch { fail(res, 503, "OPERATOR_UNAVAILABLE"); }
});
server.requestTimeout = 15000; server.headersTimeout = 5000; server.keepAliveTimeout = 5000;
server.maxHeadersCount = 64; server.maxConnections = 64;
server.on("clientError", (_error, socket) => socket.destroy());
return server;
}
