import { expect, test, type Page } from "@playwright/test";

const current = { id: 3, name: "Ty_Dubai", used_from: "2026-09-22T00:50:35Z", used_to: null };
const previous = { id: 2, name: "Tvmobile101", used_from: "2026-09-16T11:30:46Z", used_to: current.used_from };
const older = { id: 1, name: "EarlierName", used_from: "2026-08-01T12:00:00Z", used_to: previous.used_from };

async function profile(page: Page, history: object[], status = 200) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let body: unknown = [];
    if (url.pathname.endsWith("/auth/me")) {
      body = { id: 1, username: "HistoryTester", is_approved: true, linked_player_id: 735868465 };
    } else if (url.pathname.endsWith("/players/735868465")) {
      body = {
        player: { id: "735868465", name: current.name, platform: "PSN", level: 1, title: "Dream Killer", loading_frame: "Default Ally Team", privacy_flag: "n", verified: false },
        queueRatings: [], championRatings: [],
        profileRefresh: { ttl_seconds: 3600, remaining_seconds: 0, expired: true, attempted: false, refreshed: false, source: "database" },
      };
    } else if (url.pathname.includes("/player-ext/name-history/")) {
      const offset = (Number(url.searchParams.get("page")) - 1) * 20;
      await route.fulfill({ status, json: history.slice(offset, offset + 20) });
      return;
    } else {
      await route.fulfill({ status: 404, json: { error: { code: "FIXTURE_NOT_FOUND" } } });
      return;
    }
    await route.fulfill({ json: body });
  });
  await page.goto("/players/735868465");
  await expect(page.getByRole("heading", { name: current.name, exact: true })).toBeVisible();
}

test("one previous name sits beside the title without a history button", async ({ page }) => {
  await profile(page, [current, previous]);
  const label = page.getByText("Previously Tvmobile101", { exact: true });
  await expect(label).toBeVisible();
  await expect(page.getByRole("button", { name: "History", exact: true })).toHaveCount(0);
  const titleBox = await page.getByRole("heading", { name: current.name }).boundingBox();
  const labelBox = await label.boundingBox();
  expect(labelBox!.x).toBeGreaterThan(titleBox!.x);
  await page.screenshot({ path: "../local/build/player-name-history-header.png" });
});

test("multiple changes show newest-first date ranges and an Escape-dismissable dialog", async ({ page }) => {
  await profile(page, [current, previous, older]);
  const button = page.getByRole("button", { name: "History", exact: true });
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Previous names" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("li")).toHaveCount(2);
  await expect(dialog.locator("li").first()).toContainText(previous.name);
  await expect(dialog.locator("time").first()).toHaveAttribute("datetime", previous.used_from);
  await expect(dialog.locator("time").nth(1)).toHaveAttribute("datetime", previous.used_to);
  await page.screenshot({ path: "../local/build/player-name-history-dialog.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(button).toBeFocused();
});

test("mobile history loads older pages without dropping repeated name intervals", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const intervals = Array.from({ length: 22 }, (_, index) => ({ ...previous, id: index + 10, name: index % 2 ? "RepeatedName" : "AnotherName" }));
  await profile(page, [current, ...intervals]);
  await page.getByRole("button", { name: "History", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Previous names" });
  await expect(dialog.locator("li")).toHaveCount(19);
  await dialog.getByRole("button", { name: "Load older names" }).click();
  await expect(dialog.locator("li")).toHaveCount(22);
  await expect(dialog.getByRole("button", { name: "Load older names" })).toHaveCount(0);
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

for (const status of [200, 403]) {
  test(`no previous names or restricted history stays hidden (${status})`, async ({ page }) => {
    await profile(page, status === 403 ? [current, previous, older] : [current], status);
    await expect(page.getByText(/^Previously /)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "History", exact: true })).toHaveCount(0);
  });
}

test("a failed history request can be retried", async ({ page }) => {
  await profile(page, [], 500);
  const retry = page.getByRole("button", { name: "Retry name history" });
  await expect(retry).toBeVisible();
  await page.route("**/player-ext/name-history/**", (route) => route.fulfill({ json: [current, previous] }));
  await retry.click();
  await expect(page.getByText("Previously Tvmobile101", { exact: true })).toBeVisible();
});
