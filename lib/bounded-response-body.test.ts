import assert from "node:assert/strict";
import test from "node:test";
import { readBodyWithinLimit } from "./bounded-response-body.ts";

function bodyFrom(chunks: number[][], onCancel?: () => void): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(Uint8Array.from(chunks[index++]));
      } else {
        controller.close();
      }
    },
    cancel() {
      onCancel?.();
    },
  });
}

test("bounded reader combines a response at the byte limit", async () => {
  const result = await readBodyWithinLimit(bodyFrom([[1, 2], [3, 4]]), 4);
  assert.deepEqual(result, Uint8Array.from([1, 2, 3, 4]));
});

test("bounded reader cancels before retaining an oversized response", async () => {
  let cancelled = false;
  const result = await readBodyWithinLimit(
    bodyFrom([[1, 2, 3], [4, 5]], () => { cancelled = true; }),
    4,
  );
  assert.equal(result, null);
  assert.equal(cancelled, true);
});

test("bounded reader rejects empty or absent bodies", async () => {
  assert.equal(await readBodyWithinLimit(bodyFrom([]), 4), null);
  assert.equal(await readBodyWithinLimit(null, 4), null);
});
