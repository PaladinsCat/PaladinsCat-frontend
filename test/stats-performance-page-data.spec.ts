import { expect, test } from "@playwright/test";

const metrics = ["kpm", "deaths_per_minute", "dpm", "wpm", "apm", "hpm", "shpm", "gpm", "egpm", "spm", "kda"];

function summary(mean: number) {
  return { min: mean - 100, max: mean + 100, mean, median: mean, mode: mean, p10: mean - 50, p25: mean - 25, p75: mean + 25, p90: mean + 50, sample_size: 42 };
}

function completePageData() {
  const roles = Object.fromEntries(["Frontline", "Damage", "Flank", "Support"].map(role => [role, summary(12345)]));
  const groups = metrics.map(metric => ({
    metric,
    rows: [{ champion_id: 2281, champion_name: "Bomb King", class: "Damage", ...summary(12345), avg_value: 12345, total_matches: 42 }],
  }));
  return {
    dashboard: { scope: "ranked", queue_ids: [486], dpm: summary(12345), roles },
    comparison: groups,
    champions: [{ champion_id: 2281, champion_name: "Bomb King", win_rate: 0.56, total_matches: 42, wins: 24, ban_total: 0 }],
    globalMetrics: Object.fromEntries(metrics.map(metric => [metric, summary(12345)])),
  };
}

test("performance page retries one incomplete bundle and hydrates both chart sections from it", async ({ page }) => {
  let bundleCalls = 0;
  const performanceFallbackCalls: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/stats/performance") && !url.pathname.endsWith("/performance-page-data")) {
      performanceFallbackCalls.push(url.pathname);
    }
  });
  await page.route("**/api/stats/performance-page-data**", async route => {
    bundleCalls += 1;
    if (bundleCalls === 1) {
      return route.fulfill({ json: { ...completePageData(), comparison: [{ metric: "dpm", rows: [] }] } });
    }
    return route.fulfill({ json: completePageData() });
  });
  await page.route("**/api/auth/me", route => route.fulfill({ json: {
    user_id: 7, username: "verified-test", email: "verified@example.test", avatar_url: null,
    bio: null, linked_player_id: 735868465, linked_player_name: "Verified Player",
  } }));

  await page.goto("/stats/performance", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Ranked Performance Metrics" })).toBeVisible();
  await expect(page.getByText("12,345").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Champion comparison" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Bomb King/ })).toBeVisible();
  expect(bundleCalls).toBe(2);
  expect(performanceFallbackCalls).toEqual([]);
});
