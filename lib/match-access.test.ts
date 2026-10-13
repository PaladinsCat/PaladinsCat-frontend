import assert from "node:assert/strict";
import test from "node:test";
import { matchDetailSections } from "./match-access.ts";

test("match detail sections use a two-tier visual model (loadouts for all, full details for verified)", () => {
  assert.deepEqual(matchDetailSections("guest"), { loadouts: true, fullDetails: false });
  assert.deepEqual(matchDetailSections("account"), { loadouts: true, fullDetails: false });
  assert.deepEqual(matchDetailSections("verified"), { loadouts: true, fullDetails: true });
});
