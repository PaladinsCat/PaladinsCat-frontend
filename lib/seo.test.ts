/** Verify SEO label normalization and safe JSON-LD serialization. · refs: none */
import assert from "node:assert/strict";
import test from "node:test";
import { cleanSeoLabel, serializeJsonLd } from "./seo.ts";

test("SEO labels collapse control characters and enforce a bounded fallback", () => {
  assert.equal(cleanSeoLabel("  Player\n Name  ", "unknown"), "Player Name");
  assert.equal(cleanSeoLabel("\u0000\t", "Player 42"), "Player 42");
  assert.equal(cleanSeoLabel("abcdefgh", "unknown", 4), "abcd");
});

test("JSON-LD serialization cannot terminate its script element", () => {
  const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(serialized.includes("</script>"), false);
  assert.match(serialized, /\\u003c\/script>/);
});
