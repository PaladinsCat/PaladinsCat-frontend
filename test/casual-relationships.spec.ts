import { expect, test, type Page } from "@playwright/test";

const playerId = "728968546";

async function fixture(page: Page) {
  const requestedScopes: string[] = [];
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/auth/me")) return route.fulfill({ json: {
      id: 1, username: "RelationshipsTester", is_approved: true, linked_player_id: Number(playerId),
    } });
    if (url.pathname.endsWith(`/coplay/summary/${playerId}`)) {
      const scope = url.searchParams.get("scope") ?? "ranked";
      requestedScopes.push(scope);
      const casual = scope === "casual";
      const row = { other_player_id: casual ? 200 : 300, other_player_name: casual ? "CasualAlly" : "RankedAlly",
        match_count: 4, metric_match_count: 3, wins: 2, losses: 1, win_rate: 66.67,
        metrics_complete: false, first_seen: "2026-10-01T12:00:00Z", last_seen: "2026-10-04T12:00:00Z" };
      await new Promise(resolve => setTimeout(resolve, 100));
      return route.fulfill({ json: { player_id: playerId, scope, queue_ids: casual ? [424,452,469] : [486],
        totals: { unique_teammates: 1, unique_opponents: 1, teammate_matches: 4, opponent_matches: 3,
          party_partners: 1, party_matches: 3, party_metric_matches: 2, party_wins: 2, party_losses: 0 },
        teammates: [row], opponents: [{ ...row, other_player_id: 400, other_player_name: casual ? "CasualOpponent" : "RankedOpponent" }],
        party_partners: [{ ...row, match_count: 3, metric_match_count: 2, wins: 2, losses: 0, win_rate: 100, same_party: true }],
      } });
    }
    if (url.pathname.endsWith(`/players/${playerId}`)) return route.fulfill({ json: {
      player: { id: playerId, name: "RelationshipsPlayer", platform: "Steam", level: 1, privacy_flag: "n" },
      queueRatings: [], championRatings: [],
    } });
    if (url.pathname.endsWith(`/players/${playerId}/matches`)) return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { error: { code: "FIXTURE_NOT_FOUND" } } });
  });
  return requestedScopes;
}

test("relationship page separates scopes, party counts and direct casual links", async ({ page }) => {
  const requested = await fixture(page);
  await page.goto(`/players/${playerId}/relationships`);
  await expect(page.getByRole("heading", { name: "Ranked Relationships", exact: true })).toBeVisible();
  await expect(page.getByText("RankedAlly", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Casual", exact: true }).click();
  await expect(page).toHaveURL(/scope=casual$/);
  await expect(page.getByText("RankedAlly", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Casual Relationships", exact: true })).toBeVisible();
  await expect(page.getByText("CasualAlly", { exact: true })).toBeVisible();
  await expect(page.getByText("Matches Together", { exact: true }).locator("..").getByText("3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Opponents/ }).click();
  await expect(page.getByText("CasualOpponent", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Party Partners/ }).click();
  await expect(page.getByText("CasualAlly", { exact: true })).toBeVisible();
  expect(requested).toContain("ranked");
  expect(requested).toContain("casual");
  await page.goto(`/players/${playerId}/relationships?scope=casual`);
  await expect(page.getByRole("heading", { name: "Casual Relationships", exact: true })).toBeVisible();
  await page.screenshot({ path: "../local/casual-relationships-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("CasualAlly", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "../local/casual-relationships-mobile.png", fullPage: true });
});

test("profile summary switches scope and keeps it in the detail link", async ({ page }) => {
  await fixture(page);
  await page.goto(`/players/${playerId}`);
  await expect(page.getByRole("heading", { name: "RelationshipsPlayer", exact: true })).toBeVisible();
  const scope = page.getByRole("group", { name: "Player Relationships", exact: true });
  await expect(scope.getByRole("button", { name: "Ranked", exact: true })).toHaveAttribute("aria-pressed", "true");
  await scope.getByRole("button", { name: "Casual", exact: true }).click();
  await expect(page.getByText(/Casual Siege, TDM, and Onslaught teammates/)).toBeVisible();
  await expect(page.locator(`a[href="/players/${playerId}/relationships?scope=casual"]`)).toBeVisible();
  await expect(page.getByText("CasualAlly", { exact: true })).toBeVisible();
});
