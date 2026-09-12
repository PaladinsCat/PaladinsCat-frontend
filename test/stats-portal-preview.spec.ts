import { expect, test } from "@playwright/test";

test("guest directory loads bounded previews while detail links still require login", async ({ page }) => {
  const paths: string[] = [];
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    paths.push(url.pathname);
    if (url.pathname === "/api/auth/me") {
      return route.fulfill({ status: 401, json: { error: { code: "LOGIN_REQUIRED" } } });
    }
    if (url.pathname === "/api/stats/portal-preview") {
      expect(url.searchParams.get("tierMin")).not.toBe("undefined");
      return route.fulfill({ json: {
        page: { overview: { metrics: { dpm: { mean: 12345, sample_size: 10, p10: 100, p90: 20000 } } }, skins: [], baselines: [], compositions: [] },
        skins: [], loadoutChampions: [], matchups: { champions: [] },
        presence: { public_players: 456 }, presenceHourly: { hourly_by_region: [] },
      } });
    }
    if (url.pathname === "/api/matches/hourly-stats") {
      return route.fulfill({ json: { allQueuesTotal24h: 789, hourly: [] } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto("/stats", { waitUntil: "domcontentloaded" });
  const performance = page.locator('a[data-card-accent][href*="stats%2Fperformance"]');
  await expect(performance).toContainText("12,345", { timeout: 30_000 });
  await expect(performance).toHaveAttribute("href", "/auth/login?redirect=%2Fstats%2Fperformance");
  expect(paths).toContain("/api/stats/portal-preview");
  for (const detail of ["/api/stats/page-data", "/api/stats/talents", "/api/stats/skins", "/api/stats/presence", "/api/stats/presence/hourly", "/api/stats/champions/matchup-previews"]) {
    expect(paths).not.toContain(detail);
  }
});
