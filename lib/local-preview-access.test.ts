import { test } from "node:test";
import assert from "node:assert/strict";
import { localPreviewAccessAllowed } from "./local-preview-access.ts";

test("local preview access needs explicit development opt-in on loopback", () => {
  for (const hostname of ["localhost", "127.0.0.1", "[::1]", "::1"]) {
    assert.equal(localPreviewAccessAllowed("development", "1", hostname), true);
    for (const mode of ["production", "test", undefined]) {
      assert.equal(localPreviewAccessAllowed(mode, "1", hostname), false);
    }
    for (const enabled of [undefined, "", "0", "true"]) {
      assert.equal(localPreviewAccessAllowed("development", enabled, hostname), false);
    }
  }
  for (const hostname of ["paladinscat.com", "localhost.example.com", "192.168.1.2", "0.0.0.0", ""]) {
    assert.equal(localPreviewAccessAllowed("development", "1", hostname), false);
  }
});
