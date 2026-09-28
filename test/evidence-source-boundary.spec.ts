/** Verify that user-report and automated evidence stay on their intended pages. */
import { expect, test } from "@playwright/test";

const playerId = "736435575";

test("portal shows user reports and the player page labels automated evidence", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/cheaters/evidence") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          total: 1,
          items: [
            { id: "1", origin: "player_submitted", playerId: Number(playerId), subjectName: "Portal Subject", title: "User report title", description: "User report detail", createdAt: "2026-09-28T12:00:00Z" },
            { id: "2", origin: "automated", playerId: Number(playerId), subjectName: "Agent Subject", title: "Automated portal leak", description: "Must stay off the portal", createdAt: "2026-09-28T12:00:00Z" },
            { id: "3", origin: "unknown", playerId: Number(playerId), subjectName: "Internal Subject", title: "Unknown portal leak", description: "Must stay internal", createdAt: "2026-09-28T12:00:00Z" },
          ],
        }),
      });
      return;
    }
    if (path === `/api/players/exploiters/${playerId}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          player: { id: Number(playerId), name: "Player Evidence Fixture", platform: "PC", region: "NA", cheater: true, exploiter: true },
          matches: [],
          cosmeticEvidence: [],
          flagEvidence: [
            { id: 4, origin: "player_submitted", title: "User linked evidence", description: "User report", createdAt: "2026-09-28T12:00:00Z" },
            { id: 5, origin: "automated", title: "Agent T1 match signal", description: "Automated review evidence", createdAt: "2026-09-28T12:00:00Z" },
            { id: 6, origin: "unknown", title: "Unknown internal evidence", description: "Must stay internal", createdAt: "2026-09-28T12:00:00Z" },
          ],
          flags: [],
        }),
      });
      return;
    }
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "AUTH" }) });
  });

  await page.goto("/evidence");
  await expect(page.getByRole("heading", { name: "User report title" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Automated portal leak" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Unknown portal leak" })).toHaveCount(0);

  await page.getByRole("link", { name: "Portal Subject" }).click();
  await expect(page).toHaveURL(new RegExp(`/evidence/${playerId}$`));
  await expect(page.getByRole("heading", { name: "Player Evidence Fixture" })).toBeVisible();
  const systemRow = page.getByRole("row").filter({ hasText: "Agent T1 match signal" });
  const userRow = page.getByRole("row").filter({ hasText: "User linked evidence" });
  await expect(systemRow.locator("td").first()).toHaveText("System flagged");
  await expect(userRow.locator("td").first()).toHaveText("User reported");
  await expect(page.getByText("Unknown internal evidence", { exact: true })).toHaveCount(0);
});
