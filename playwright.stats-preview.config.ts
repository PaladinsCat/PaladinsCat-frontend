/** Bounded regression against an already-running local frontend; no build or server mutation. */
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./test", testMatch: "stats-portal-preview.spec.ts",
  workers: 1, retries: 0, timeout: 45_000, reporter: "line",
  use: { baseURL: "http://localhost:3000", browserName: "chromium" },
});
