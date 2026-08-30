import assert from "node:assert/strict";
import test from "node:test";

import { CHAMPION_PAGE_CLIENT_TIMEOUT_MS } from "./champion-page-data.ts";

test("tier-scoped champion bundles allow a bounded cold response", () => {
  assert.equal(CHAMPION_PAGE_CLIENT_TIMEOUT_MS, 5_000);
});
