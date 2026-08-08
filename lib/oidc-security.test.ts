import test from "node:test";
import assert from "node:assert/strict";
process.env.OIDC_TRANSACTION_SECRET = "01234567890123456789012345678901";
import { createTransaction, readTransaction, requireSameOrigin, safeReturnPath } from "./oidc-security.ts";

test("rejects open redirects", () => {
  for (const path of ["https://evil.example", "//evil.example", "/%5c%5cevil.example", "/admin", "/auth/login"]) assert.equal(safeReturnPath(path), "/");
  assert.equal(safeReturnPath("/players/42?tab=builds"), "/players/42?tab=builds");
});
test("state and signed transaction bind callback", () => {
  const { transaction, signed } = createTransaction("/account");
  assert.equal(readTransaction(signed, transaction.state)?.nonce, transaction.nonce);
  assert.equal(readTransaction(signed, "replayed-or-wrong-state"), null);
  assert.equal(readTransaction(`${signed}x`, transaction.state), null);
});
test("unsafe requests require exact origin", () => {
  assert.equal(requireSameOrigin("https://paladinscat.com", "https://paladinscat.com"), true);
  assert.equal(requireSameOrigin("https://evil.example", "https://paladinscat.com"), false);
  assert.equal(requireSameOrigin(null, "https://paladinscat.com"), false);
});
