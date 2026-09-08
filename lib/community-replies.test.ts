import assert from "node:assert/strict";
import test from "node:test";
import { orderReplies } from "./community-replies.ts";

test("groups replies and preserves orphaned comments without cycling", () => {
  const comments = [{ id: 1, parentId: null }, { id: 2, parentId: null }, { id: 3, parentId: 1 }, { id: 4, parentId: 3 }, { id: 5, parentId: 99 }, { id: 6, parentId: 7 }, { id: 7, parentId: 6 }];
  assert.deepEqual(orderReplies(comments).map((comment) => comment.id), [1, 3, 4, 2, 5, 6, 7]);
});
