import assert from "node:assert/strict";
import test from "node:test";
import { matchDetailSections } from "./match-access.ts";

test("match detail sections follow guest, account, and verified tiers", () => {
  assert.deepEqual(matchDetailSections("guest"), { loadouts: false, fullDetails: false });
  assert.deepEqual(matchDetailSections("account"), { loadouts: true, fullDetails: false });
  assert.deepEqual(matchDetailSections("verified"), { loadouts: true, fullDetails: true });
});
