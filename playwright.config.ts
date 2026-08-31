/** playwright.config component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
import { defineConfig } from "@playwright/test";

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default defineConfig({
  testDir: "./test",
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
