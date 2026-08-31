/** Tests player-tag threshold classification and boundary cases.
 * The module owns the existing validation, policy, label, title, or preference behavior.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { hasPlayerTag, PLAYER_TAG_MINIMUM_COUNT } from "./player-tag-threshold.ts";

test("player tags begin at the inclusive five-count boundary", () => {
  assert.equal(PLAYER_TAG_MINIMUM_COUNT, 5);
  assert.equal(hasPlayerTag(4), false);
  assert.equal(hasPlayerTag(5), true);
});
