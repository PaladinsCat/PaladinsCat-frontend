/** Verify the public player identifier guard used before server-side profile requests. · refs: none */
import assert from "node:assert/strict";
import test from "node:test";
import { isPublicPlayerId } from "./seo.ts";

test("public player IDs are positive bounded decimal identifiers", () => {
  assert.equal(isPublicPlayerId("6354199"), true);
  assert.equal(isPublicPlayerId("0"), false);
  assert.equal(isPublicPlayerId("01"), false);
  assert.equal(isPublicPlayerId("12345678901"), false);
  assert.equal(isPublicPlayerId("1/refresh"), false);
});
