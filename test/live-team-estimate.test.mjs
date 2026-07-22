import assert from "node:assert/strict";
import test from "node:test";
import { estimateLiveTeamWinChance } from "../lib/live-team-estimate.ts";

test("blends queue ELO and global win rate into complementary team chances", () => {
  const estimate = estimateLiveTeamWinChance([
    { task_force: 1, queue_elo: 1800, profile_win_rate: 55 },
    { task_force: 1, queue_elo: 1700, profile_win_rate: 52 },
    { task_force: 1, queue_elo: 1600, profile_win_rate: 50 },
    { task_force: 2, queue_elo: 1600, profile_win_rate: 50 },
    { task_force: 2, queue_elo: 1500, profile_win_rate: 48 },
    { task_force: 2, queue_elo: 1400, profile_win_rate: 45 },
  ]);

  assert.deepEqual(estimate, { teamOne: 72, teamTwo: 28 });
});

test("requires at least three ELO records per full team", () => {
  const estimate = estimateLiveTeamWinChance([
    { task_force: 1, queue_elo: 1700, profile_win_rate: 55 },
    { task_force: 1, profile_win_rate: 52 },
    { task_force: 1, profile_win_rate: 50 },
    { task_force: 1, profile_win_rate: 51 },
    { task_force: 1, profile_win_rate: 53 },
    { task_force: 2, queue_elo: 1600, profile_win_rate: 50 },
    { task_force: 2, profile_win_rate: 48 },
    { task_force: 2, profile_win_rate: 45 },
    { task_force: 2, profile_win_rate: 49 },
    { task_force: 2, profile_win_rate: 47 },
  ]);

  assert.equal(estimate, null);
});

test("clamps highly uneven estimates and ignores invalid metrics", () => {
  const estimate = estimateLiveTeamWinChance([
    { task_force: 1, queue_elo: 3000, profile_win_rate: 100 },
    { task_force: 1, queue_elo: 3000, profile_win_rate: 100 },
    { task_force: 1, queue_elo: 3000, profile_win_rate: 100 },
    { task_force: 2, queue_elo: 500, profile_win_rate: 0 },
    { task_force: 2, queue_elo: 500, profile_win_rate: 0 },
    { task_force: 2, queue_elo: 500, profile_win_rate: 0 },
    { task_force: 2, queue_elo: "invalid", profile_win_rate: 250 },
  ]);

  assert.deepEqual(estimate, { teamOne: 85, teamTwo: 15 });
});
