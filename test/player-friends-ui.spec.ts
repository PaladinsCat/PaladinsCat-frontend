/** Verify relationship separation in the real route using local API fixtures only. */
import { expect, test } from "@playwright/test";

for (const width of [1280, 390]) {
  test(`Friends/Blocked selector separates entries without refetching at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let friendRequests = 0;
    await page.route("**/api/**", async route => {
      if (new URL(route.request().url()).pathname.endsWith("/001/friends")) {
        friendRequests++;
        await route.fulfill({ json: {
          friends: [
            { id: "101", name: "Friend fixture", platform: null, status: "Friend" },
            { id: "102", name: "Blocked fixture", platform: null, status: "Blocked" },
          ],
          total: 2, status: "ready", refreshed: true, refresh_error: null,
          freshness: { ttl_seconds: 180, expired: false, remaining_seconds: 180, refreshed_at: new Date().toISOString(), expires_at: new Date(Date.now() + 180000).toISOString() },
        } });
      } else if (new URL(route.request().url()).pathname.startsWith("/api/auth/")) {
        await route.fulfill({ status: 401, json: { error: "Not authenticated" } });
      } else {
        await route.fulfill({ json: { data: [], status: "idle", notifications: [], banners: [] } });
      }
    });
    // Invalid public metadata ID avoids server profile acquisition; the browser API is stubbed.
    await page.goto("/players/001/friends");
    const group = page.getByRole("group", { name: "Friends", exact: true });
    const friends = group.getByRole("button", { name: "Friends", exact: true });
    const blocked = group.getByRole("button", { name: "Blocked", exact: true });
    await expect(group.getByRole("button")).toHaveCount(2);
    await expect(friends).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Blocked fixture", exact: true })).toHaveCount(0);
    const loadedRequests = friendRequests;
    await blocked.click();
    await expect(blocked).toHaveAttribute("aria-pressed", "true");
    await expect(friends).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("link", { name: "Blocked fixture", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toHaveCount(0);
    await friends.click();
    await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toBeVisible();
    expect(friendRequests).toBe(loadedRequests);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("an empty blocked list has its own empty state", async ({ page }) => {
  await page.route("**/api/**", async route => {
    if (new URL(route.request().url()).pathname.endsWith("/001/friends")) {
      await route.fulfill({ json: {
        friends: [{ id: "101", name: "Friend fixture", platform: null, status: "Friend" }],
        total: 1, status: "ready", refreshed: true, refresh_error: null,
        freshness: { ttl_seconds: 180, expired: false, remaining_seconds: 180, refreshed_at: new Date().toISOString(), expires_at: new Date(Date.now() + 180000).toISOString() },
      } });
    } else if (new URL(route.request().url()).pathname.startsWith("/api/auth/")) {
      await route.fulfill({ status: 401, json: { error: "Not authenticated" } });
    } else {
      await route.fulfill({ json: { data: [], status: "idle", notifications: [], banners: [] } });
    }
  });
  await page.goto("/players/001/friends");
  await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toBeVisible();
  await page.getByRole("group", { name: "Friends", exact: true }).getByRole("button", { name: "Blocked", exact: true }).click();
  await expect(page.getByText("No blocked players to show.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Friend fixture", exact: true })).toHaveCount(0);
});
