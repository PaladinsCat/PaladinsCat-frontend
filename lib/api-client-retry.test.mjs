import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise the real request loop with deterministic transport and timers.
const source = readFileSync(new URL("./api-client.ts", import.meta.url), "utf8");
const parsed = ts.createSourceFile("api-client.ts", source, ts.ScriptTarget.Latest, true);
const requestLoop = parsed.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "fetchJson");
const compiled = ts.transpileModule(requestLoop.getText(parsed).replace("export ", ""), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture(responses) {
  const delays = [];
  let calls = 0;
  class ApiRequestError extends Error {}
  const fetchJson = new Function("fetch", "setTimeout", "clearTimeout", "API_BASE", "FETCH_TIMEOUT_MS",
    "withStoredLobbyTier", "csrfHeader", "API_ERROR_KEYS", "ApiRequestError", `${compiled}; return fetchJson;`)(
    async () => responses[Math.min(calls++, responses.length - 1)],
    (callback, delay) => {
      if (delay <= 30_000) {
        delays.push(delay);
        queueMicrotask(callback);
      }
      return 1;
    },
    () => {}, "/api", 45_000, (path) => path, () => null,
    { genericFailure: "failure" }, ApiRequestError,
  );
  return { fetchJson, delays, calls: () => calls };
}

const busy = (retryAfter) => Response.json({ error: { code: "DATA_BUSY" } }, {
  status: 503, headers: retryAfter === undefined ? {} : { "Retry-After": retryAfter },
});

test("recent matches wait for the advertised busy window before recovering", async () => {
  const expected = [{ match_id: "1282416902" }];
  const client = fixture([busy("2"), busy("2"), Response.json(expected)]);
  assert.deepEqual(await client.fetchJson("/players/736642310/matches?limit=20"), expected);
  assert.deepEqual(client.delays, [2000, 2000]);
  assert.equal(client.calls(), 3);
});

test("persistent busy responses still stop at the existing attempt limit", async () => {
  const client = fixture([busy("120")]);
  await assert.rejects(client.fetchJson("/players/736642310/matches?limit=20"));
  assert.deepEqual(client.delays, [30_000, 30_000]);
  assert.equal(client.calls(), 3);
});

test("missing or invalid hints and write requests retain the existing backoff", async () => {
  for (const [retryAfter, method] of [[undefined, "GET"], ["invalid", "GET"], ["-1", "GET"], ["2", "POST"]]) {
    const client = fixture([busy(retryAfter), Response.json([])]);
    await client.fetchJson("/players/736642310/matches", { method });
    assert.deepEqual(client.delays, [500]);
  }
});
