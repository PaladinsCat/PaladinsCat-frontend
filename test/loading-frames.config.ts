import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "loading-frames.spec.ts",
  workers: 1,
  retries: 0,
  reporter: [["line"], ["json", { outputFile: process.env.LOADING_FRAME_REPORT ?? "test-results/loading-frames.json" }]],
  use: { baseURL: "http://127.0.0.1:3101", browserName: "chromium", headless: true },
});
