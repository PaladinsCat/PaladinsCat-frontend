import assert from "node:assert/strict";
import test from "node:test";
import { getQueueLabel } from "../lib/queue-labels.ts";

test("known live queues use human-readable match labels", () => {
  assert.equal(getQueueLabel(424), "Casual Siege");
  assert.equal(getQueueLabel(452), "Casual Onslaught");
  assert.equal(getQueueLabel(469), "Casual Team Deathmatch");
  assert.equal(getQueueLabel(486), "Ranked Siege");
});

test("unknown queues retain a debuggable fallback", () => {
  assert.equal(getQueueLabel(999), "Queue #999");
});
