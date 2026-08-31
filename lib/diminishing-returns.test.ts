/** Tests diminishing-return calculations and thresholds.
 * The module preserves the existing validation, storage, formatting, or asset boundary.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDirectionalDiminishedValue,
  calculateDiminishedValue,
  detectDescriptionEffects,
  extractWeaponDamageOverride,
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

test("parser separates player, deployable, and shield weapon damage", () => {
  const base = { id: 2, name: "Fixture", type: "item" as const };
  const bulldozer = detectDescriptionEffects({ ...base, description: ["Your weapon shots deal 60% increased Damage", "to Deployables, Pets, and Illusions."].join(" ") });
  assert.deepEqual(bulldozer.map((effect) => effect.key), ["weapon-damage-deployables"]);

  const wrecker = detectDescriptionEffects({ ...base, description: ["Your weapon attacks deal 60% increased Damage", "to Shields."].join(" ") });
  assert.deepEqual(wrecker.map((effect) => effect.key), ["weapon-damage-shields"]);

  const triggerScent = detectDescriptionEffects({ ...base, description: ["Increase your in-hand weapon damage dealt", "by 18% after an Elimination."].join(" ") });
  assert.deepEqual(triggerScent.map((effect) => effect.key), [
    "weapon-damage",
    "weapon-damage-deployables",
    "weapon-damage-shields",
  ]);
});

test("parser recognizes the audited conditional weapon talent wording", () => {
  const fixtures = [
    { id: 16370, name: "Over the Moon", value: 20, count: 3, description: ["[Soar] Increase the damage you deal with your weapon shots", "by 20% for 3s after Soar ends."].join(" ") },
    { id: 16384, name: "Exaction", value: 30, count: 3, description: ["[Dodge Roll] For 8s after using Dodge Roll,", "your next weapon shot's damage is increased by 30%."].join(" ") },
    { id: 16406, name: "Cat Burglar", value: 30, count: 3, description: ["[Prowl] Increase the damage of each of your daggers", "from your first dagger sets within 5s of Prowl ending by 30%."].join(" ") },
    { id: 16383, name: "Fusillade", value: 25, count: 3, description: ["[Weapon] Damage dealt when hitting an enemy directly", "with Rocket Launcher or Salvo is increased by 25%."].join(" ") },
    { id: 16456, name: "Steady Aim", value: 30, count: 3, description: ["[Sniper Mode] For 7s after hitting a fully-charged weapon shot,", "your next fully-charged shot will deal an additional 30% damage."].join(" ") },
    { id: 26957, name: "Paratrooper", value: 10, count: 3, description: ["While in Commanding Leap,", "gain 10% increased Weapon Damage."].join(" ") },
    { id: 20315, name: "Opportunity in Chaos", value: 10, count: 3, description: ["[Weapon] After firing continuously for 2s,", "gain 10% increased damage."].join(" ") },
    { id: 16389, name: "Ferocity", value: 60, count: 3, description: ["[Weapon] Increase your maximum damage scaling", "over distance by 60%."].join(" ") },
    { id: 31059, name: "It's Got Some Heft", value: 20, count: 1, description: ["War's attacks now deal an additional 20% damage", "to each enemy hit for each enemy hit in total with your attack."].join(" ") },
  ];

  for (const fixture of fixtures) {
    const detected = detectDescriptionEffects({ ...fixture, type: "talent" });
    assert.equal(detected.length, fixture.count, fixture.name);
    assert.ok(detected.every((entry) => entry.value === fixture.value && entry.direction === "increase" && entry.target === "self"), fixture.name);
  }
});

test("parser preserves player-only, stack, direction, and target scope for talents", () => {
  const precision = detectDescriptionEffects({
    id: 18814,
    name: "Precision",
    type: "talent",
    description: ["[Weapon] Hitting an enemy with Heirloom Rifle increases", "your Heirloom Rifle damage against that enemy by 7% for 3s, stacking up to 4 times."].join(" "),
  });
  assert.deepEqual(precision.map(({ key, value, direction, target }) => ({ key, value, direction, target })), [
    { key: "weapon-damage", value: 28, direction: "increase", target: "self" },
  ]);

  const catalyst = detectDescriptionEffects({
    id: 16391,
    name: "Catalyst",
    type: "talent",
    description: ["[Explosive Flask] Enemies hit with Explosive Flask", "take 30% increased damage from your weapon shots for 3s."].join(" "),
  });
  assert.deepEqual(catalyst.map(({ key, value, direction, target }) => ({ key, value, direction, target })), [
    { key: "weapon-damage", value: 30, direction: "increase", target: "enemy" },
  ]);

  const luminary = detectDescriptionEffects({
    id: 19223,
    name: "Luminary",
    type: "talent",
    description: ["[Astral Mark] Allies affected by your Astral Mark", "deal 15% increased weapon damage."].join(" "),
  });
  assert.equal(luminary.length, 3);
  assert.ok(luminary.every((entry) => entry.value === 15 && entry.target === "ally"));

  const storm = detectDescriptionEffects({
    id: 22890,
    name: "Storm of Bullets",
    type: "talent",
    description: ["[Weapon] Increase your Attack Speed by 40%,", "but reduce your damage-per-shot by 25%."].join(" "),
  });
  assert.equal(storm.length, 3);
  assert.ok(storm.every((entry) => entry.value === 25 && entry.direction === "decrease" && entry.target === "self"));

  const resuscitate = detectDescriptionEffects({
    id: 33709,
    name: "Resuscitate",
    type: "talent",
    description: ["Increase the Health and Weapon DMG bonus", "of Soul Collector to 2% per charge."].join(" "),
  });
  assert.equal(resuscitate.length, 3);
  assert.ok(resuscitate.every((entry) => entry.value === 30));
});

test("parser does not reinterpret talent damage wording as an unrelated slow", () => {
  const ensnare = detectDescriptionEffects({
    id: 16386,
    name: "Ensnare",
    type: "talent",
    description: ["[Net Shot] Increase the damage you deal to targets Slowed by Net Shot by 20%", "and increases the duration of Net Shot's Slow by 0.5s."].join(" "),
  });
  assert.deepEqual(ensnare.map(({ key, value, direction, target }) => ({ key, value, direction, target })), [
    { key: "weapon-damage", value: 20, direction: "increase", target: "self" },
  ]);

  const bigGame = detectDescriptionEffects({
    id: 16434,
    name: "Big Game",
    type: "talent",
    description: ["Your weapon shots deal an additional 8%", "of that enemy's maximum Health as damage."].join(" "),
  });
  assert.deepEqual(bigGame, []);
});

test("weapon override parser covers current weapon-tagged replacement talents", () => {
  assert.equal(extractWeaponDamageOverride("[Weapon] Modify your Blunderbuss to fire a single slug that deals 480 damage."), 480);
  assert.equal(extractWeaponDamageOverride("[Weapon] Star Splitter now deals 360 damage every 0.4s."), 360);
  assert.equal(extractWeaponDamageOverride("[Weapon] Switch your rifle to Three-Shot-Burst mode, firing three 220-damage shots every 0.4s."), 220);
  assert.equal(extractWeaponDamageOverride("[Fireball] Fireball now deals 900 damage."), null);
});
