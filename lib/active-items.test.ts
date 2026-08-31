/** Tests active-item filtering and cache-backed item selection.
 * These tests verify active-item filtering and selection behavior.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVE_ITEMS, activeItemTierAtLevel } from "./active-items.ts";

test("the active item roster has complete, unique three-level data", () => {
  assert.equal(ACTIVE_ITEMS.length, 20);
  assert.equal(new Set(ACTIVE_ITEMS.map((item) => item.name)).size, ACTIVE_ITEMS.length);
  assert.equal(new Set(ACTIVE_ITEMS.map((item) => item.fallbackId)).size, ACTIVE_ITEMS.length);

  for (const item of ACTIVE_ITEMS) {
    assert.deepEqual(item.tiers.map((tier) => tier.level), [1, 2, 3], item.name);
    assert.ok(item.tiers.every((tier) => Number.isSafeInteger(tier.cost) && tier.cost > 0), item.name);
    assert.ok(item.tiers[0].cost < item.tiers[1].cost, item.name);
    assert.ok(item.tiers[1].cost < item.tiers[2].cost, item.name);
    assert.ok(item.tiers.every((tier) => tier.description.trim().length > 0), item.name);
    assert.ok(item.tiers.every((tier) => !/[{}]/.test(tier.description)), item.name);
  }
});

test("known stale item descriptions use the current effects", () => {
  const resilience = ACTIVE_ITEMS.find((item) => item.name === "Resilience");
  const rejuvenate = ACTIVE_ITEMS.find((item) => item.name === "Rejuvenate");
  const veteran = ACTIVE_ITEMS.find((item) => item.name === "Veteran");
  const hoard = ACTIVE_ITEMS.find((item) => item.name === "Hoard");

  assert.deepEqual(resilience?.tiers.map((tier) => tier.cost), [200, 400, 600]);
  assert.match(resilience?.tiers[2].description ?? "", /75%/);
  assert.match(rejuvenate?.tiers[0].description ?? "", /healing output by 10%/i);
  assert.match(veteran?.tiers[0].description ?? "", /base maximum Health by 6%/);
  assert.equal(hoard?.tiers[2].cost, 1750);
  assert.match(hoard?.tiers[2].description ?? "", /Movement, Mount, Cooldown, and Ultimate Charge speed/);
});

test("item levels resolve to their exact tier and clamp invalid input", () => {
  const resilience = ACTIVE_ITEMS.find((item) => item.name === "Resilience");
  assert.ok(resilience);
  assert.equal(activeItemTierAtLevel(resilience.tiers, 2)?.description, resilience.tiers[1].description);
  assert.equal(activeItemTierAtLevel(resilience.tiers, 0)?.level, 1);
  assert.equal(activeItemTierAtLevel(resilience.tiers, 99)?.level, 3);
});
