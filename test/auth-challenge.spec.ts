import { expect, test } from "@playwright/test";

test("verification preserves cached sign-in across refresh and reload; expired sessions clear it", async ({ page }) => {
  let status = 200;
  await page.route("**/api/**", async (route) => {
    if (!new URL(route.request().url()).pathname.endsWith("/auth/me")) {
      await route.fulfill({ status: 404, json: { error: "Fixture not found" } });
    } else if (status === 403) {
      await route.fulfill({ status, contentType: "text/html", headers: { "cf-mitigated": "challenge" }, body: "<html>Verify</html>" });
    } else {
      await route.fulfill({ status, json: status === 200 ? { id: 42, username: "PersistentUser" } : { error: "Session expired" } });
    }
  });
  await page.goto("/features");
  const cachedUser = () => page.evaluate(() => localStorage.getItem("pc_auth_user"));
  await expect.poll(cachedUser).toContain("PersistentUser");
  status = 403;
  const challenge = page.waitForResponse((res) => res.url().endsWith("/auth/me") && res.status() === 403);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await challenge;
  await expect.poll(cachedUser).toContain("PersistentUser");
  const reloadChallenge = page.waitForResponse((res) => res.url().endsWith("/auth/me") && res.status() === 403);
  await page.reload();
  await reloadChallenge;
  await expect.poll(cachedUser).toContain("PersistentUser");
  status = 200;
  const recovered = page.waitForResponse((res) => res.url().endsWith("/auth/me") && res.status() === 200);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await recovered;
  await expect.poll(cachedUser).toContain("PersistentUser");
  status = 401;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(cachedUser).toBeNull();
});
