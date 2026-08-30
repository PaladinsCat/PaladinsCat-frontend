import assert from "node:assert/strict";
import test from "node:test";
import { serializeJsonLd } from "./seo.ts";

test("JSON-LD serialization cannot terminate its script element", () => {
  const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(serialized.includes("</script>"), false);
  assert.match(serialized, /\\u003c\/script>/);
});
