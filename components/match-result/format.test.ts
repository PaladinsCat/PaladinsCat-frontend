import test from "node:test";
import assert from "node:assert/strict";
import { computeDamageStats } from "./format.ts";
import type { MatchPlayerDetail } from "../../lib/api-client.ts";

function player(weaponDamage: number | undefined, available = true) {
  return {
    damage_done_physical: 8741,
    damage_done_in_hand: weaponDamage,
    damage_breakdown_available: available,
    time_in_match: 719,
  } as MatchPlayerDetail;
}

test("invalid stored weapon damage cannot produce negative WDPM or inflated SDPM", () => {
  for (const weaponDamage of [-128, -1, NaN, Infinity, undefined]) {
    const stats = computeDamageStats(player(weaponDamage));
    assert.equal(stats.totalDamage, 8741);
    assert.equal(stats.hasWeaponBreakdown, false);
    assert.equal(stats.weaponDamage, 8741);
    assert.equal(stats.weaponPerMinute, null);
    assert.equal(stats.nonWeaponDamage, null);
    assert.equal(stats.abilityPerMinute, null);
    assert.equal(stats.weaponShare, null);
  }
});

test("explicit zero and valid weapon damage retain their authoritative split", () => {
  const zero = computeDamageStats(player(0));
  assert.equal(zero.hasWeaponBreakdown, true);
  assert.equal(zero.weaponPerMinute, 0);
  assert.equal(zero.nonWeaponDamage, 8741);
  const valid = computeDamageStats(player(5000));
  assert.equal(valid.weaponPerMinute, 5000 / (719 / 60));
  assert.equal(valid.nonWeaponDamage, 3741);
  assert.equal(valid.abilityPerMinute, 3741 / (719 / 60));
  assert.equal(computeDamageStats(player(5000, false)).weaponPerMinute, null);
});
