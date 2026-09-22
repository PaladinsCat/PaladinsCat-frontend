import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
import base from "../playwright.config";

// Browser API fixtures run locally without production account/gate credentials.
export default defineConfig({
  ...base,
  use: { ...base.use, channel: process.env.PLAYWRIGHT_CHANNEL },
  testDir: ".",
  testMatch: "player-name-history.spec.ts",
  outputDir: "../test-results",
  webServer: {
    cwd: resolve(__dirname, ".."),
    command: "npx next dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
