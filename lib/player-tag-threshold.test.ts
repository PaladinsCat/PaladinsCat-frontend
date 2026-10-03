/** Tests player-tag threshold classification and boundary cases.
 * The module owns the existing validation, policy, label, title, or preference behavior.
 * refs: none
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPlayerTag,
  hasSuspiciousTag,
  PLAYER_TAG_MINIMUM_COUNT,
  SUSPICIOUS_TAG_MINIMUM_COUNT,
} from "./player-tag-threshold.ts";

test("player tags begin at the inclusive five-count boundary", () => {
  assert.equal(PLAYER_TAG_MINIMUM_COUNT, 5);
  assert.equal(hasPlayerTag(4), false);
  assert.equal(hasPlayerTag(5), true);
});

test("suspicious tags begin at the inclusive three-count boundary", () => {
  assert.equal(SUSPICIOUS_TAG_MINIMUM_COUNT, 3);
  assert.equal(hasSuspiciousTag(2), false);
  assert.equal(hasSuspiciousTag(3), true);
  assert.equal(hasSuspiciousTag(5), true);
});
