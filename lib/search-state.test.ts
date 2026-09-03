/**
 * Validates universal-search state normalization, merging, and reducer transitions.
 * Preserve its server boundary and caller-facing data contracts.
 * refs: none
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createInitialSearchState, searchReducer } from "./search-state.ts";
import type { UniversalSearchResult } from "./api-client.ts";

function playerResult(title: string): UniversalSearchResult {
  return {
    type: "player",
    id: title.toLowerCase(),
    title,
    subtitle: "",
    href: `/players/${title.toLowerCase()}`,
    score: 100,
  };
}

test("a URL-seeded match lookup stays pending until automatic search settles", () => {
  const initial = createInitialSearchState("1281483173");
  assert.equal(initial.loading, true);
  assert.equal(initial.searched, true);

  const typed = searchReducer(createInitialSearchState(""), {
    type: "set-query",
    query: "1281483173",
  });
  assert.equal(typed.loading, true);
});

test("test → clear → apple keeps apple in the input and shows only Apple results", () => {
  let state = createInitialSearchState("");

  // type "test"
  state = searchReducer(state, { type: "set-query", query: "test" });
  const testGeneration = state.generation;
  state = searchReducer(state, { type: "search-start", generation: testGeneration });

  // user clears before the "test" response lands
  state = searchReducer(state, { type: "clear" });
  assert.equal(state.query, "");
  assert.deepEqual(state.results, []);

  // type "apple"
  state = searchReducer(state, { type: "set-query", query: "apple" });
  const appleGeneration = state.generation;

  // the stale "test" response arrives late — it must be discarded entirely
  state = searchReducer(state, {
    type: "search-result",
    generation: testGeneration,
    results: [playerResult("Test")],
    remoteNotice: null,
  });
  assert.equal(state.query, "apple", "input must remain apple after stale response");
  assert.deepEqual(state.results, [], "stale test results must not be displayed");

  // the apple search completes and is applied
  state = searchReducer(state, { type: "search-start", generation: appleGeneration });
  state = searchReducer(state, {
    type: "search-result",
    generation: appleGeneration,
    results: [playerResult("Apple")],
    remoteNotice: null,
  });
  assert.equal(state.query, "apple");
  assert.deepEqual(state.results.map((r) => r.title), ["Apple"]);
});

test("clear immediately invalidates an in-flight search", () => {
  let state = createInitialSearchState("");
  state = searchReducer(state, { type: "set-query", query: "test" });
  const generation = state.generation;
  state = searchReducer(state, { type: "search-start", generation });

  // clear bumps the generation, so a late result for the old query is dropped
  state = searchReducer(state, { type: "clear" });
  state = searchReducer(state, {
    type: "search-result",
    generation,
    results: [playerResult("Test")],
    remoteNotice: null,
  });
  assert.equal(state.query, "");
  assert.deepEqual(state.results, []);
  assert.equal(state.loading, false);
});
