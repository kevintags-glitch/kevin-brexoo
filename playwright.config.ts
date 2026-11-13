import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build and the local Supabase stack
 * (`npx supabase start`), which includes a mail catcher for confirmation emails.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "off", screenshot: "only-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run start -- -p 3000", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
