import assert from "node:assert/strict";
import test from "node:test";
import { PERFORMANCE_MATCH_TAGS, normalizeMatchPerformanceTags } from "./player-match-tags.ts";

test("match evidence supports all nine earning tags and rejects unrelated or duplicate labels", () => {
  assert.deepEqual(normalizeMatchPerformanceTags([...PERFORMANCE_MATCH_TAGS, "dps_diff", "cheater", null]), PERFORMANCE_MATCH_TAGS);
  for (const value of [undefined, null, "dps_diff", [], ["unknown"]]) {
    assert.deepEqual(normalizeMatchPerformanceTags(value), []);
  }
});
