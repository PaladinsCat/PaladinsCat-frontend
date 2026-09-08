/** Check unequal samples, cumulative baseline recovery and unavailable values.
 * refs: see: lib/player-trends-state.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { trendMean, openingTrendTotals } from "./player-trends-state.ts";

test("unequal daily samples recover the exact prior cumulative mean",()=>{
  const total={championId:0,matches:12,wins:8,sums:{kpm:27},samples:{kpm:12}};
  const buckets=[
    {championId:0,date:"2026-09-06",matches:1,wins:1,sums:{kpm:9},samples:{kpm:1},elo:null},
    {championId:0,date:"2026-09-07",matches:9,wins:6,sums:{kpm:9},samples:{kpm:9},elo:null},
    {championId:2404,date:"2026-09-07",matches:9,wins:6,sums:{kpm:9},samples:{kpm:9},elo:null},
  ];
  const opening=openingTrendTotals(total,buckets);
  assert.equal(opening.matches,2); assert.equal(opening.wins,1);
  assert.equal(trendMean(opening,"kpm"),4.5);
  assert.equal(trendMean(total,"kpm"),2.25);
  assert.equal(total.matches,12);
});
test("unmeasured rates differ from measured zero",()=>{
  assert.equal(trendMean(undefined,"kpm"),null);
  assert.equal(trendMean({championId:0,matches:1,wins:0,sums:{deaths_per_minute:0},samples:{deaths_per_minute:1}},"deaths_per_minute"),0);
  assert.equal(trendMean({championId:0,matches:1,wins:0,sums:{},samples:{}},"wpm"),null);
});
