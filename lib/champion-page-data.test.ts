/** Tests champion page data assembly.
 * The module preserves canonical data, asset, or metadata behavior used by existing callers.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { CHAMPION_PAGE_CLIENT_TIMEOUT_MS } from "./champion-page-data.ts";

test("tier-scoped champion bundles allow a bounded cold response", () => {
  assert.equal(CHAMPION_PAGE_CLIENT_TIMEOUT_MS, 5_000);
});
