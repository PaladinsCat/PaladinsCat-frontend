import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const code = ts.transpileModule(readFileSync(new URL("../app/api/community/posts/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const handler = { exports: {} };
new Function("require", "module", "exports", code)(require, handler, handler.exports);

test("community post proxy preserves OIDC context and streams multipart uploads", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.NEXT_SERVER_API_URL;
  try {
    process.env.NEXT_SERVER_API_URL = "http://backend.example:3005";
    const csrf = "a".repeat(32);
    const form = new FormData();
    form.set("title", "Test fixture only");
    form.set("content", "No production submission");
    const request = new NextRequest("https://paladinscat.com/api/community/posts?limit=20", {
      method: "POST", body: form,
      headers: {
        cookie: `unrelated=private; __Host-pc_session=test-session; __Host-pc_csrf=${csrf}`,
        origin: "https://paladinscat.com", "x-forwarded-proto": "https", "x-csrf-token": csrf,
      },
    });
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "http://backend.example:3005/community/posts?limit=20");
      assert.equal(init.headers.get("cookie"), `__Host-pc_session=test-session; __Host-pc_csrf=${csrf}`);
      assert.equal(init.headers.get("authorization"), null);
      assert.equal(init.headers.get("content-type"), request.headers.get("content-type"));
      assert.equal(init.headers.get("origin"), "https://paladinscat.com");
      assert.equal(init.headers.get("x-forwarded-proto"), "https");
      assert.equal(init.headers.get("x-csrf-token"), csrf);
      assert.equal(init.body, request.body);
      assert.equal(init.cache, "no-store");
      assert.equal(init.duplex, "half");
      return new Response("accepted", { status: 201, headers: { "retry-after": "2" } });
    };
    const response = await handler.exports.POST(request);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("retry-after"), "2");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.NEXT_SERVER_API_URL;
    else process.env.NEXT_SERVER_API_URL = originalBase;
  }
});

test("community post proxy forwards bearer-authenticated listing reads", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.NEXT_SERVER_API_URL;
  try {
    process.env.NEXT_SERVER_API_URL = "http://backend.example:3005";
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "http://backend.example:3005/community/posts");
      assert.equal(init.headers.get("authorization"), "Bearer legacy-session");
      assert.equal(init.headers.get("cookie"), null);
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    };
    const response = await handler.exports.GET(new NextRequest("https://paladinscat.com/api/community/posts", {
      headers: { authorization: "Bearer legacy-session" },
    }));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "[]");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.NEXT_SERVER_API_URL;
    else process.env.NEXT_SERVER_API_URL = originalBase;
  }
});
