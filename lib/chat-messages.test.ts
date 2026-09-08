import assert from "node:assert/strict";
import test from "node:test";
import { mergeChatMessages } from "./chat-messages.ts";

test("reconnect duplicates collapse and delayed history cannot undo moderation", () => {
  const deleted = { id: 2, revision: 10, content: "" };
  const result = mergeChatMessages([deleted], [
    { id: 2, revision: 2, content: "deleted text" },
    { id: 1, revision: 1, content: "older" },
    deleted,
    { id: 3, revision: 11, content: "new" },
  ]);
  assert.deepEqual(result.map((message) => message.id), [1, 2, 3]);
  assert.equal(result[1].content, "");
});
