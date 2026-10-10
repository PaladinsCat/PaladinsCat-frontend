/** Verify relationship separation in the real route using local API fixtures only. */
import { expect, test, type Page } from "@playwright/test";

function snapshot(friends: Array<Record<string, unknown>> = [], status = "ready") {
  return {
    friends, total: friends.length, status, refreshed: true, refresh_error: null,
    freshness: { ttl_seconds: 180, expired: false, remaining_seconds: 180, refreshed_at: new Date().toISOString(), expires_at: new Date(Date.now() + 180000).toISOString() },
  };
}

async function stubFriends(page: Page, response: unknown) {
  let friendRequests = 0;
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/001/friends")) {
      friendRequests++;
      await route.fulfill({ json: response });
    } else if (path.startsWith("/api/auth/")) {
      await route.fulfill({ status: 401, json: { error: "Not authenticated" } });
    } else {
      await route.fulfill({ json: { data: [], status: "idle", notifications: [], banners: [] } });
    }
  });
  return () => friendRequests;
}

function selector(page: Page) {
  return page.getByRole("group", { name: "Friends", exact: true });
}

function entries(page: Page) {
  return page.locator("section[aria-busy] ul").getByRole("link");
}

for (const width of [1280, 390]) {
  test(`Friends/Blocked selector separates entries without refetching at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const friendRequests = await stubFriends(page, snapshot([
      { id: "101", name: "Friend fixture", platform: null, status: "Friend" },
      { id: "102", name: "Blocked fixture", platform: null, status: "Blocked" },
      { id: "103", name: "Other friend fixture", platform: "Steam", status: "Friend" },
      { id: "104", name: "Other blocked fixture", platform: "Steam", status: "Blocked" },
    ]));
    // Invalid public metadata ID avoids server profile acquisition; the browser API is stubbed.
    await page.goto("/players/001/friends");
    const group = selector(page);
    const friends = group.getByRole("button", { name: "Friends", exact: true });
    const blocked = group.getByRole("button", { name: "Blocked", exact: true });
    await expect(group.getByRole("button")).toHaveCount(2);
    await expect(friends).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Blocked fixture", exact: true })).toHaveCount(0);
    await expect(entries(page)).toHaveCount(2);
    await expect(entries(page)).toHaveText(["Friend fixture", "Other friend fixture"]);
    const loadedRequests = friendRequests();
    await blocked.click();
    await expect(blocked).toHaveAttribute("aria-pressed", "true");
    await expect(friends).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("link", { name: "Blocked fixture", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toHaveCount(0);
    await expect(entries(page)).toHaveCount(2);
    await expect(entries(page)).toHaveText(["Blocked fixture", "Other blocked fixture"]);
    await friends.click();
    await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toBeVisible();
    await expect(entries(page)).toHaveCount(2);
    expect(friendRequests()).toBe(loadedRequests);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("an empty blocked list has its own empty state", async ({ page }) => {
  await stubFriends(page, snapshot([{ id: "101", name: "Friend fixture", platform: null, status: "Friend" }]));
  await page.goto("/players/001/friends");
  await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toBeVisible();
  await selector(page).getByRole("button", { name: "Blocked", exact: true }).click();
  await expect(page.getByText("No blocked players to show.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toHaveCount(0);
});

for (const [label, response] of [
  ["unclassified", snapshot([{ id: "101", name: "Unclassified fixture", platform: null }])],
  ["unknown relationship", snapshot([{ id: "101", name: "Unknown fixture", platform: null, status: "Pending" }])],
  ["partially classified", snapshot([
    { id: "101", name: "Friend fixture", platform: null, status: "Friend" },
    { id: "102", name: "Unclassified fixture", platform: null },
  ])],
  ["missing rows", { ...snapshot(), friends: null }],
  ["inconsistent total", { ...snapshot(), total: 1 }],
  ["missing freshness", { ...snapshot(), freshness: null }],
] as const) {
  test(`${label} ready snapshot shows an error instead of an empty or partial list`, async ({ page }) => {
    await stubFriends(page, response);
    await page.goto("/players/001/friends");
    await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
    await expect(page.getByText(/server returned an invalid JSON response/)).toBeVisible();
    await expect(entries(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "No friends to show.", exact: true })).toHaveCount(0);
    await selector(page).getByRole("button", { name: "Blocked", exact: true }).click();
    await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No blocked players to show.", exact: true })).toHaveCount(0);
  });
}

test("private snapshots keep the privacy view for both relationships", async ({ page }) => {
  await stubFriends(page, snapshot([], "private"));
  await page.goto("/players/001/friends");
  await expect(page.getByRole("heading", { name: "This list is private.", exact: true })).toBeVisible();
  await selector(page).getByRole("button", { name: "Blocked", exact: true }).click();
  await expect(page.getByRole("heading", { name: "This list is private.", exact: true })).toBeVisible();
  await expect(entries(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
});

test("valid empty snapshots show the selected relationship's empty view", async ({ page }) => {
  const friendRequests = await stubFriends(page, snapshot());
  await page.goto("/players/001/friends");
  await expect(page.getByRole("heading", { name: "No friends to show.", exact: true })).toBeVisible();
  const loadedRequests = friendRequests();
  await selector(page).getByRole("button", { name: "Blocked", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No blocked players to show.", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  expect(friendRequests()).toBe(loadedRequests);
});

test("unavailable snapshots keep the unavailable error view", async ({ page }) => {
  await stubFriends(page, {
    ...snapshot([], "unavailable"), refreshed: false,
    freshness: { ttl_seconds: 180, expired: true, remaining_seconds: 0, refreshed_at: null, expires_at: null },
  });
  await page.goto("/players/001/friends");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  await expect(page.getByText(/No friends snapshot has been saved for player 001/)).toBeVisible();
  await expect(page.getByText(/server returned an invalid JSON response/)).toHaveCount(0);
  await expect(entries(page)).toHaveCount(0);
});
