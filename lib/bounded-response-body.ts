/** Bounds response-body reads before JSON parsing.
 * This helper limits response-body reads before JSON decoding.
 * Returns: `Promise<Uint8Array | null>`
 */
/** readBodyWithinLimit applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 */
export async function readBodyWithinLimit(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (!body || !Number.isSafeInteger(maxBytes) || maxBytes <= 0) return null;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel("response body exceeded byte limit").catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) return null;

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
