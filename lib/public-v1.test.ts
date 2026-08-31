/** Tests public-v1 path and response policy.
 * The module owns the existing validation, policy, label, title, or preference behavior.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { publicV1Path } from "./public-v1.ts";

test("publicV1Path prefixes relative backend routes", () => {
  assert.equal(publicV1Path("/reference/champions"), "/api/v1/reference/champions");
  assert.equal(publicV1Path("stats/overview?scope=ranked"), "/api/v1/stats/overview?scope=ranked");
  assert.equal(publicV1Path(""), "/api/v1/");
});

test("publicV1Path is idempotent for already-prefixed paths", () => {
  assert.equal(publicV1Path("/api/v1/matches/123"), "/api/v1/matches/123");
});

test("publicV1Path rejects absolute URLs", () => {
  assert.throws(() => publicV1Path("https://example.test/data"), /relative backend paths/);
  assert.throws(() => publicV1Path("//example.test/data"), /relative backend paths/);
  assert.throws(() => publicV1Path("../auth/me"), /cannot escape/);
  assert.throws(() => publicV1Path("/api/v1/%2e%2e/admin"), /cannot escape/);
});
