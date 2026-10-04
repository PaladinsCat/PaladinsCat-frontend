import { expect, test } from "@playwright/test";

const hours = Array.from({ length: 24 }, (_, index) => ({
  date: "2026-10-02", hour: index, total: index === 22 ? 2 : 0,
  regions: index === 22 ? { EU: 1, NA: 1 } : {},
}));
const series = { total24h: 2, regions: [{ region: "EU", total24h: 1 }, { region: "NA", total24h: 1 }], hourly: hours };
const ranked = { total24h: 1, regions: [{ region: "EU", total24h: 1 }], hourly: hours.map(hour => ({
  ...hour, total: hour.total ? 1 : 0, regions: hour.total ? { EU: 1 } : {},
})) };

test("cheater charts follow latest records, share queue selection, and keep 24 hours on mobile", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/auth/me", route => route.fulfill({ json: {
    user_id: 7, username: "verified-test", email: "verified@example.test", avatar_url: null,
    bio: null, linked_player_id: 735868465, linked_player_name: "Verified Player",
  } }));
  await page.route("**/api/cheaters/portal", route => route.fulfill({ json: {
    activeCount: 2, inactiveCount: 0, evidenceCount: 0, latest: [],
  } }));
  await page.route("**/api/players/overview**", route => route.fulfill({ json: {} }));
  await page.route("**/api/cheaters/activity", async route => {
    calls += 1;
    await new Promise(resolve => setTimeout(resolve, 100));
    return route.fulfill({ json: { windowHours: 24, observedAt: "2026-10-02T23:30:00Z", matches: series, players: series,
      queues: [{ queueId: 486, queueName: "Ranked Siege", matches: ranked, players: ranked }],
      breakdown: { public_players: 2,
        public_by_queue: [{ queue_id: 486, queue_name: "Ranked Siege", players: 2 }, { queue_id: 424, queue_name: "Casual Siege", players: 1 }],
        public_by_platform: [{ platform: "Steam", players: 1 }, { platform: "PSN", players: 1 }],
        public_by_region: [{ region: "EU", players: 1 }, { region: "NA", players: 1 }],
      },
    } });
  });
  await page.goto("/players/cheaters", { waitUntil: "domcontentloaded" });
  const charts = page.getByTestId("cheater-activity");
  await expect(charts.getByRole("heading", { name: "Cheaters · 24h Match Activity" })).toBeVisible();
  await expect(charts.getByRole("heading", { name: "Cheaters · Players · last 24 hours" })).toBeVisible();
  await expect(charts.locator("[data-activity-hour]")).toHaveCount(48);
  const breakdown = page.getByTestId("cheater-presence-breakdown");
  await expect(breakdown.getByRole("heading", { name: "Players by queue", exact: true })).toBeVisible();
  await expect(breakdown.getByRole("heading", { name: "Players by platform", exact: true })).toBeVisible();
  await expect(breakdown.getByRole("heading", { name: "Players by region", exact: true })).toBeVisible();
  await expect(breakdown.getByText("Platform coverage: 100%", { exact: true })).toBeVisible();
  await expect(breakdown.getByText("Steam", { exact: true })).toBeVisible();
  const breakdownBox = await breakdown.boundingBox();
  const hourlyBox = await charts.boundingBox();
  expect(breakdownBox!.y).toBeGreaterThanOrEqual(hourlyBox!.y + hourlyBox!.height);
  const latest = await page.locator("#latest-cheaters-preview-title").boundingBox();
  const chartBox = await charts.boundingBox();
  expect(chartBox!.y).toBeGreaterThan(latest!.y + latest!.height);
  const initialCalls = calls;
  expect(initialCalls).toBe(1);
  await charts.getByRole("combobox").first().selectOption("486");
  await expect(charts.getByRole("combobox").last()).toHaveValue("486");
  await expect(charts.getByText("NA · 1", { exact: true })).toHaveCount(0);
  await expect(charts.getByText("EU · 1", { exact: true }).filter({ visible: true })).toHaveCount(2);
  expect(calls).toBe(initialCalls);
  await charts.screenshot({ path: "../local/cheater-activity-desktop.png" });
  await breakdown.screenshot({ path: "../local/cheater-breakdown-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(charts.locator("[data-activity-hour]")).toHaveCount(48);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await charts.screenshot({ path: "../local/cheater-activity-mobile.png" });
  await expect(breakdown.getByRole("heading", { name: "Players by platform", exact: true })).toBeVisible();
  await breakdown.screenshot({ path: "../local/cheater-breakdown-mobile.png" });
});
