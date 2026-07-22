import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDirectionalDiminishedValue,
  calculateDiminishedValue,
  detectDescriptionEffects,
} from "./diminishing-returns.ts";

const closeTo = (actual: number, expected: number, epsilon = 0.001) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};

test("stacks normally through the 30 percent threshold", () => {
  assert.equal(calculateDiminishedValue([10, 10]).final, 20);
  assert.equal(calculateDiminishedValue([10, 10, 10]).final, 30);
  assert.equal(calculateDiminishedValue([20, 10]).final, 30);
});

test("uses a 30 percent guaranteed base when small effects cross the threshold", () => {
  const justOver = calculateDiminishedValue([10, 10, 10, 1]);
  closeTo(justOver.final, 30.802469);
  assert.ok(justOver.final <= justOver.additive);
  assert.equal(justOver.positive.guaranteedBase, 30);
  assert.equal(justOver.thresholdApplied, true);

  const twoTwenties = calculateDiminishedValue([20, 20]);
  closeTo(twoTwenties.final, 37.222222);
  assert.equal(twoTwenties.positive.guaranteedBase, 30);
});

test("preserves the published 30, 20, 20, 10 example", () => {
  const result = calculateDiminishedValue([30, 20, 20, 10]);
  closeTo(result.final, 55);
  assert.equal(result.positive.guaranteedBase, 30);
});

test("keeps a single source at full value until the actual cap changes it", () => {
  assert.equal(calculateDiminishedValue([40]).final, 40);

  const belowCap = calculateDiminishedValue([50, 50]);
  closeTo(belowCap.final, 65);
  assert.equal(belowCap.capped, false);

  const capped = calculateDiminishedValue([100]);
  assert.equal(capped.final, 95);
  assert.equal(capped.capped, true);
});

test("keeps reload speed additive and caps it at 60 percent", () => {
  const result = calculateDiminishedValue([50, 40], { reload: true });
  assert.equal(result.additive, 90);
  assert.equal(result.final, 60);
  assert.equal(result.capped, true);
  assert.equal(result.thresholdApplied, false);
});

test("diminishes opposing directions separately before combining them", () => {
  const result = calculateDiminishedValue([40, -20]);
  assert.equal(result.positive.final, 40);
  assert.equal(result.negative.final, 20);
  assert.equal(result.final, 20);
});

test("directional calculations remain bounded, monotonic, and order independent", () => {
  for (const movement of [false, true]) {
    const cap = movement ? 150 : 95;
    let previous = 0;
    for (let extra = 0; extra <= 100; extra += 5) {
      const result = calculateDirectionalDiminishedValue([10, 10, 10, extra], movement);
      assert.ok(result.final >= previous - 1e-9);
      assert.ok(result.final <= result.additive + 1e-9);
      assert.ok(result.final >= 0 && result.final <= cap);
      previous = result.final;
    }
    const forward = calculateDirectionalDiminishedValue([10, 25, 5, 20], movement);
    const reverse = calculateDirectionalDiminishedValue([20, 5, 25, 10], movement);
    closeTo(forward.final, reverse.final, 1e-9);
  }
});

test("parser records direction and target for opposing effects", () => {
  const base = { id: 1, name: "Fixture", type: "card" as const };

  const slow = detectDescriptionEffects({ ...base, description: ["Slow enemies", "by 25% for 2s."].join(" ") });
  assert.deepEqual(slow.map(({ key, value, direction, target }) => ({ key, value, direction, target })), [
    { key: "movement-speed", value: 25, direction: "decrease", target: "enemy" },
  ]);

  const damageTaken = detectDescriptionEffects({ ...base, description: ["Enemies hit", "take 15% increased damage for 3s."].join(" ") });
  assert.equal(damageTaken.length, 2);
  assert.ok(damageTaken.every((effect) => effect.direction === "decrease" && effect.target === "enemy"));

  const healingReduction = detectDescriptionEffects({ ...base, description: ["Target receives", "30% less healing."].join(" ") });
  assert.deepEqual(healingReduction.map(({ key, value, direction, target }) => ({ key, value, direction, target })), [
    { key: "healing-received", value: 30, direction: "decrease", target: "enemy" },
  ]);

  const selfPenalty = detectDescriptionEffects({ ...base, description: ["Increase your damage taken", "by 20% for 2s."].join(" ") });
  assert.equal(selfPenalty.length, 2);
  assert.ok(selfPenalty.every((effect) => effect.direction === "decrease" && effect.target === "self"));
});
