import assert from "node:assert/strict";
import test from "node:test";
import { fetchPlayerModeration, fetchPlayerModerationBatch } from "./player-moderation.ts";

test("both moderation reads expire at the match boundary rather than the five-minute cache TTL", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let now = 1_000;
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    const id = Number(new URL(String(url), "http://fixture").searchParams.get("ids"));
    return {
      ok: true,
      json: async () => ({ players: [{
        id,
        wall_shooter_count: now < 2_000 ? 5 : 0,
        automatic_tag_expires_at: now < 2_000 ? 2_000 : null,
        cheater: true,
      }] }),
    };
  };
  Date.now = () => now;
  try {
    const batch = await fetchPlayerModerationBatch([930001]);
    assert.equal(batch.get(930001).wallShooterCount, 5);
    assert.equal((await fetchPlayerModeration(930002)).wallShooterCount, 5);
    assert.equal(calls, 2);
    now = 1_999;
    await Promise.all([fetchPlayerModeration(930001), fetchPlayerModeration(930002)]);
    assert.equal(calls, 2, "reads inside the window must reuse cached counts");
    now = 2_000;
    for (const id of [930001, 930002]) {
      const refreshed = await fetchPlayerModeration(id);
      assert.equal(refreshed.wallShooterCount, 0);
      assert.equal(refreshed.cheater, true, "administrative decisions do not expire");
    }
    assert.equal(calls, 4, "each cache entry must refresh at its observation expiry");
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
  }
});
