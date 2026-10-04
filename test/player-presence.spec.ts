import { expect, test, type Page } from "@playwright/test";

const playerId = "728968546";

async function profile(page: Page, status: number, statusString = "God Selection", fail = false, quotaReached = false) {
  let presenceCalls = 0;
  let profileCalls = 0;
  let refreshCalls = 0;
  let refreshed = false;
  let releaseRefresh: (() => void) | undefined;
  const bundle = () => ({
    presence: fail ? null : { status: refreshed ? 3 : status, status_string: statusString, Match: refreshed ? 1282373812 : 0, ret_msg: null },
    statusRefresh: { refreshed, error: fail ? "Hi-Rez returned no usable player status. Refresh the profile to retry." : null },
    profileRefresh: { ttl_seconds: 30, remaining_seconds: 30, expired: false,
      refreshed_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30_000).toISOString() },
  });
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) return route.fulfill({ json: {
      id: 1, username: "PresenceTester", is_approved: true, linked_player_id: Number(playerId),
    } });
    if (path.endsWith(`/live/players/${playerId}/status`) || path.endsWith(`/players/${playerId}/status`)) {
      presenceCalls++;
      return route.fulfill({ status: 404, json: { error: { code: "NO_INDEPENDENT_STATUS_REQUEST" } } });
    }
    if (path.endsWith(`/players/${playerId}/refresh`)) {
      refreshCalls++;
      if (quotaReached) return route.fulfill({ status: 429, headers: { "Retry-After": "120" }, json: {
        error: { code: "PLAYER_REFRESH_LIMIT_REACHED", message: "The shared limit of five profile, match-history and status refreshes per rolling ten minutes has been reached." },
      } });
      await new Promise<void>(resolve => { releaseRefresh = resolve; });
      refreshed = true;
      return route.fulfill({ json: { ...bundle(), historyRefresh: { refreshed: true },
        message: "Player profile, match history and status refresh completed", refreshQuota: { remaining: 3 } } });
    }
    if (path.endsWith(`/players/${playerId}/matches`)) return route.fulfill({ json: [{
      match_id: refreshed ? "1282373812" : "1281434754", champion_name: "Ying", win_status: "Winner",
      kills: 5, deaths: 2, assists: 10, queue_id: 486, map_game: "Frog Isle", time_in_match_seconds: 600,
      entry_datetime: "2026-10-04T01:00:00Z",
    }] });
    if (path.endsWith(`/players/${playerId}`)) {
      profileCalls++;
      return route.fulfill({ json: {
      ...bundle(),
      player: { id: playerId, name: "TioSallyzZ", platform: "Xbox", level: 1, title: "One Hit Wonder", privacy_flag: "n", verified: false },
      queueRatings: [], championRatings: [],
    } }); }
    return route.fulfill({ status: 404, json: { error: { code: "FIXTURE_NOT_FOUND" } } });
  });
  await page.goto(`/players/${playerId}`);
  await expect(page.getByRole("heading", { name: "TioSallyzZ", exact: true })).toBeVisible();
  await expect(page.locator('a[href="/matches/1281434754"]')).toHaveCount(2);
  return { calls: () => presenceCalls, profiles: () => profileCalls, refreshes: () => refreshCalls, release: () => releaseRefresh?.() };
}

for (const [status, label] of [[0, "Offline"], [1, "In lobby"], [2, "Champion selection"], [3, "In match"], [4, "Online"], [5, "Unknown status"], [99, "God Selection"]] as const) {
  test(`presence ${status} is visible with its icon above the actions`, async ({ page }) => {
    const request = await profile(page, status);
    const presence = page.getByTestId("player-presence");
    await expect(presence).toHaveText(label);
    await expect(presence.locator("svg")).toHaveCount(1);
    expect(request.calls()).toBe(0);
    const badge = await presence.boundingBox();
    const actions = await page.getByRole("button", { name: "Current", exact: true }).boundingBox();
    const lastAction = await page.getByRole("button", { name: "Actions", exact: true }).boundingBox();
    expect(badge!.y + badge!.height).toBeLessThanOrEqual(actions!.y);
    expect(Math.abs(badge!.x + badge!.width - lastAction!.x - lastAction!.width)).toBeLessThan(2);
    if (status === 2) await presence.locator("xpath=ancestor::div[contains(@class,'pc-card')][1]").screenshot({ path: "../local/build/player-presence-desktop.png" });
  });
}

test("one Refresh within TTL updates bound status and history and fits mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const request = await profile(page, 2);
  await expect(page.getByTestId("player-presence")).toHaveText("Champion selection");
  await page.getByTestId("player-presence").locator("xpath=ancestor::div[contains(@class,'pc-card')][1]").screenshot({ path: "../local/build/player-presence-mobile.png" });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect.poll(request.refreshes).toBe(1);
  await expect(page.getByTestId("player-presence")).toHaveAttribute("aria-busy", "true");
  await expect(page.getByTestId("player-presence")).toHaveText("Champion selection");
  await expect(page.locator('a[href="/matches/1282373812"]')).toHaveCount(0);
  const badge = await page.getByTestId("player-presence").boundingBox();
  expect(badge!.x).toBeGreaterThanOrEqual(0);
  expect(badge!.x + badge!.width).toBeLessThanOrEqual(390);
  request.release();
  await expect(page.getByRole("button", { name: "Refresh", exact: true })).toBeEnabled();
  await expect(page.getByTestId("player-presence")).toHaveText("In match");
  await expect(page.locator('a[href="/matches/1282373812"]')).toHaveCount(2);
  await expect(page.locator('a[href="/matches/1281434754"]')).toHaveCount(0);
  expect(request.refreshes()).toBe(1);
  expect(request.calls()).toBe(0);
});

test("failed presence reports the operation instead of showing Offline", async ({ page }) => {
  await profile(page, 0, "Offline", true);
  const presence = page.getByTestId("player-presence");
  await expect(presence).toHaveText("Player status unavailable");
  await expect(presence.locator("span[title]")).toHaveAttribute("title", "Hi-Rez returned no usable player status. Refresh the profile to retry.");
});

test("reload reads the profile bundle without manual or separate status refresh", async ({ page }) => {
  const request = await profile(page, 2);
  const initialProfiles = request.profiles();
  await page.reload();
  await expect(page.getByTestId("player-presence")).toHaveText("Champion selection");
  expect(request.profiles()).toBeGreaterThan(initialProfiles);
  expect(request.calls()).toBe(0);
  expect(request.refreshes()).toBe(0);
});

test("shared quota rejection keeps status and history and applies Retry-After", async ({ page }) => {
  const request = await profile(page, 2, "God Selection", false, true);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("button", { name: /Refresh in/ })).toBeDisabled();
  await expect(page.getByTestId("player-presence")).toHaveText("Champion selection");
  await expect(page.getByTestId("player-presence")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator('a[href="/matches/1281434754"]')).toHaveCount(2);
  expect(request.refreshes()).toBe(1);
  expect(request.calls()).toBe(0);
});
