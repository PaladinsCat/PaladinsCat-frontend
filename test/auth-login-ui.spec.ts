import { expect, test, type Page } from "@playwright/test";

async function stubLoginHandoff(page: Page) {
  await page.route("**/auth/login?redirect=*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>OIDC handoff</title><h1>OIDC handoff reached</h1>",
    });
  });
}

test("desktop Login control performs a browser-native OIDC handoff", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await stubLoginHandoff(page);
  await page.goto("/");

  const login = page.getByRole("link", { name: "Login", exact: true });
  await expect(page.getByRole("button", { name: "Language" })).toContainText("EN");
  expect((await login.boundingBox())?.width).toBeLessThan(96);
  await expect(login).toHaveAttribute("href", "/auth/login?redirect=%2F");
  await login.click();

  await expect(page).toHaveURL(/\/auth\/login\?redirect=%2F$/);
  await expect(page.getByRole("heading", { name: "OIDC handoff reached" })).toBeVisible();
});

test("site-menu Login control performs a browser-native OIDC handoff", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await stubLoginHandoff(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Menu" }).click();
  const login = page.getByRole("link", { name: "Login", exact: true });
  await expect(login).toHaveAttribute("href", "/auth/login?redirect=%2F");
  await login.click();

  await expect(page).toHaveURL(/\/auth\/login\?redirect=%2F$/);
  await expect(page.getByRole("heading", { name: "OIDC handoff reached" })).toBeVisible();
});
