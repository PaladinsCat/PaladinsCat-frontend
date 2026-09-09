import assert from "node:assert/strict";
import { test } from "node:test";
import { issueGuest, validGuest, safeWebsiteRequest, websiteApiPath, GUEST_TTL_SECONDS } from "./website-gate.ts";

const secret = "ab".repeat(32);
const origin = "https://paladinscat.com";
const now = 1_800_000_000_000;

test("guest admission rejects missing, forged, expired and wrong-origin tokens", () => {
  const token = issueGuest(secret, origin, now);
  assert.equal(validGuest(token, secret, origin, now), true);
  for (const candidate of [undefined, "", "fake", token.slice(0, -1), token.replace(/.$/, token.endsWith("0") ? "1" : "0")]) {
    assert.equal(validGuest(candidate, secret, origin, now), false);
  }
  assert.equal(validGuest(token, secret, "https://other.example", now), false);
  assert.equal(validGuest(token, "cd".repeat(32), origin, now), false);
  assert.equal(validGuest(token, secret, origin, now + GUEST_TTL_SECONDS * 1000), false);
  assert.equal(validGuest(token, secret, origin, now - 1000), false);
  assert.throws(() => issueGuest("", origin));
});

test("foreign origins and same-site subdomains cannot use guest admission", () => {
  assert.equal(safeWebsiteRequest(new Headers({ origin, "sec-fetch-site": "same-origin" }), origin), true);
  const foreignHeaders: Record<string, string>[] = [{ origin: "http://127.0.0.1:3100" }, { "sec-fetch-site": "cross-site" }, { "sec-fetch-site": "same-site" }];
  for (const headers of foreignHeaders) {
    assert.equal(safeWebsiteRequest(new Headers(headers), origin), false);
  }
});

test("both compatibility aliases are website API paths", () => {
  for (const path of ["/api", "/api/notifications", "/_pc", "/_pc/matches/1", "/api/v1/health"]) assert.equal(websiteApiPath(path), true);
  for (const path of ["/apiculture", "/players/1", "/_pc-other"]) assert.equal(websiteApiPath(path), false);
});
