import { expect, test } from "@playwright/test";

test.describe("new frontend feature wiring", () => {
  test("community renders durable chat and real post content", async ({ page }) => {
    const history = page.waitForResponse((response) => response.url().includes("/api/community/chat") && !response.url().includes("/events"));
    await page.goto("/community");
    const historyResponse = await history;
    expect(historyResponse.status()).toBe(200);
    const historyBody = await historyResponse.json();
    expect(Array.isArray(historyBody.messages)).toBe(true);
    expect(Number.isFinite(Number(historyBody.cursor))).toBe(true);
    await expect(page.getByRole("region", { name: "# global" })).toBeVisible();
    await expect(page.locator('section[aria-labelledby="community-chat-title"]').getByRole("status")).toHaveText(/live/i);
    await expect(page.getByText("Gurk best in game", { exact: false })).toBeVisible();
  });

  test("champion matchup browser consumes the backend aggregate", async ({ page }) => {
    const matchup = page.waitForResponse((response) => response.url().includes("/api/stats/champions/") && response.url().includes("/matchups"));
    await page.goto("/stats/champions");
    const matchupResponse = await matchup;
    expect(matchupResponse.status()).toBe(200);
    const matchupBody = await matchupResponse.json();
    expect(matchupBody.queueId).toBe(486);
    expect(matchupBody.days).toBe(30);
    expect(matchupBody.rows.length).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { name: /champion matchups/i })).toBeVisible();
    await expect(page.getByText(/encounters/i).first()).toBeVisible();
    await page.getByRole("combobox", { name: "Champion", exact: true }).selectOption({ label: "Ash" });
    await expect(page).toHaveURL(/\/stats\/champions\/ash\?/);
    await page.goBack();
    await expect(page).toHaveURL(/\/stats\/champions$/);
    await expect(page.getByRole("combobox", { name: "Champion", exact: true })).toHaveValue("2205");
    await page.getByLabel("Search opponents").fill("no-such-champion");
    await expect(page.getByText("No eligible encounters in this window.")).toBeVisible();
  });

  test("player profile exposes trends and friends backed by real data", async ({ page }) => {
    const trends = page.waitForResponse((response) => response.url().includes("/api/players/2951457/trends"));
    await page.goto("/players/2951457");
    const trendsBody = await (await trends).json();
    const bucketDates = trendsBody.buckets.map((row: { date: string }) => row.date);
    expect(bucketDates).toEqual([...bucketDates].sort());
    await expect(page.getByRole("heading", { name: /WarThief/i })).toBeVisible();
    await expect(page.getByText(/performance trends/i).first()).toBeVisible();
    const friends = page.waitForResponse((response) => response.url().includes("/api/players/2951457/friends"));
    await page.goto("/players/2951457/friends");
    const friendsBody = await (await friends).json();
    expect(friendsBody.status).toBe("ready");
    expect(friendsBody.total).toBe(friendsBody.friends.length);
    await expect(page.getByRole("heading", { name: /friends/i })).toBeVisible();
    await expect(page.getByText("Adun71", { exact: true })).toBeVisible();
  });

  test("player trend controls persist in URL history", async ({ page }) => {
    await page.goto("/players/2951457/champions");
    await page.getByText(/champions \(59\/59\)/i).click();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page).toHaveURL(/trendChampions=/);
    await page.getByLabel("Metric").first().selectOption("kpm");
    await expect(page).toHaveURL(/trendMetric=kpm/);
    await page.getByRole("group", { name: "Metric" }).getByRole("button", { name: "Cumulative" }).click();
    await expect(page).toHaveURL(/trendMode=cumulative/);
    await page.getByRole("group", { name: "Period" }).getByRole("button", { name: "7 days" }).click();
    await expect(page).toHaveURL(/trendDays=7/);
    await page.getByLabel("Metric").first().selectOption("deaths_per_minute");
    await expect(page).toHaveURL(/trendMetric=deaths_per_minute/);
    await page.goBack();
    await expect(page).not.toHaveURL(/trendMetric=deaths_per_minute/);
    await expect(page.getByRole("group", { name: "Period" })).toBeVisible();
  });

  test("production CSP permits theme and evidence providers", async ({ page }) => {
    const response = await page.goto("/community");
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net");
    expect(csp).toContain("frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://clips.twitch.tv");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});

for (const width of [320, 517, 1024, 1600]) {
  test(`critical pages fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/community", "/stats/champions", "/players/2951457/friends"]) {
      await page.goto(route);
      await expect(page.locator("main").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  });
}
