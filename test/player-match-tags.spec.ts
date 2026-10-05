import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`earned tags identify only the qualifying matches at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/**", async route => {
      const path = new URL(route.request().url()).pathname;
      let body: unknown = [];
      if (path.endsWith("/auth/me")) body = { id: 1, username: "TagTester", is_approved: true, linked_player_id: 728968546 };
      else if (path.endsWith("/players/728968546")) body = {
        player: { id: "728968546", name: "MatchTagTester", platform: "Steam", level: 1, privacy_flag: "n", verified: true },
        queueRatings: [], championRatings: [],
        profileRefresh: { ttl_seconds: 3600, remaining_seconds: 3600, expired: false },
      };
      else if (path.endsWith("/players/728968546/matches")) body = [
        { match_id: "1282512918", champion_name: "Terminus", win_status: "Winner", kills: 10, deaths: 10, assists: 11, queue_id: 486, duration_seconds: 600, entry_datetime: new Date().toISOString(), authoritative: true,
          performance_tags: ["wall_shooter", "master_feeding", "tank_diff", "support_diff", "dps_diff", "flank_diff", "noob", "hypercarry", "automatic_afk"] },
        { match_id: "1282512576", champion_name: "Furia", win_status: "Loser", kills: 4, deaths: 10, assists: 29, queue_id: 486, duration_seconds: 600, entry_datetime: new Date().toISOString(), authoritative: true, performance_tags: [] },
      ];
      else return route.fulfill({ status: 404, json: { error: { code: "FIXTURE_NOT_FOUND" } } });
      return route.fulfill({ json: body });
    });
    await page.goto("/players/728968546");
    await expect(page.getByRole("heading", { name: "MatchTagTester", exact: true })).toBeVisible();
    const positive = width > 1000 ? page.locator("tr").filter({ has: page.locator('a[href="/matches/1282512918"]') }) : page.locator('a.pc-mobile-panel[href="/matches/1282512918"]');
    const negative = width > 1000 ? page.locator("tr").filter({ has: page.locator('a[href="/matches/1282512576"]') }) : page.locator('a.pc-mobile-panel[href="/matches/1282512576"]');
    await expect(positive.locator("[data-performance-tag]")).toHaveCount(9);
    await expect(negative.locator("[data-performance-tag]")).toHaveCount(0);
    if (width > 1000) {
      const headers = await page.locator("table thead th").allTextContents();
      expect(headers.slice(0,3).map(text => text.toLowerCase())).toEqual(["match","flags","champion"]);
      await expect(positive.locator("td").nth(1).locator("[data-performance-tag]")).toHaveCount(9);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `../local/build/player-match-tags-${width}.png`, fullPage: true });
  });
}
