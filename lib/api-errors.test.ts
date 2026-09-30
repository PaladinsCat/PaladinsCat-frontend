import assert from "node:assert/strict";
import test from "node:test";
import { API_ERROR_KEYS, ApiRequestError, formatApiErrorMessage } from "./api-errors.ts";

const translate = (key: string) => key === API_ERROR_KEYS.genericFailure
  ? "We couldn't load this data right now. Please try again."
  : key;

test("server failures identify the action and safe request diagnostics", () => {
  const error = new ApiRequestError(API_ERROR_KEYS.genericFailure, 500, {
    kind: "http",
    method: "DELETE",
    endpoint: "/community/posts/:id",
    code: "INTERNAL_ERROR",
    requestId: "req-42",
  });
  assert.equal(
    formatApiErrorMessage(error, translate, "Failed to delete post"),
    "Failed to delete post (HTTP 500; INTERNAL_ERROR; request req-42; DELETE /community/posts/:id)",
  );
  assert.match(formatApiErrorMessage(error, translate), /^DELETE \/community\/posts\/:id failed \(/);
});

test("specific server messages survive and untranslated keys never reach the UI", () => {
  const validation = new ApiRequestError("Only the post author can delete it", 403, {
    method: "DELETE", endpoint: "/community/posts/:id", code: "FORBIDDEN",
  });
  assert.match(formatApiErrorMessage(validation, translate, "Failed to delete post"), /^Only the post author can delete it \(/);
  assert.equal(formatApiErrorMessage(new Error("generated.api.missingKey"), translate, "Failed to delete post"), "Failed to delete post");
});
