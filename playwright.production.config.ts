import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  testMatch: ["frontend-feature-wiring.spec.ts", "route-manifest.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  use: { baseURL: "http://localhost:3200", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname localhost --port 3200",
    url: "http://localhost:3200",
    reuseExistingServer: false,
    timeout: 30_000,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_SERVER_API_URL: "https://paladinscat.com/api",
      NEXT_PUBLIC_API_URL: "/api",
    },
  },
});

