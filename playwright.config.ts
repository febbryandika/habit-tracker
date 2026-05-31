import { defineConfig, devices } from '@playwright/test'

// E2E tests run against the real app and require a live Postgres database.
// Before running:
//   1. Set DATABASE_URL (and BETTER_AUTH_SECRET, BETTER_AUTH_URL) in backend/.env
//      pointing to a dedicated test database to avoid polluting real data.
//   2. Apply migrations: bun run --cwd backend db:migrate
//   3. Install browsers once: bun run e2e:install
//
// Then: bun run e2e

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start both servers before the test run; reuse already-running ones in dev.
  webServer: [
    {
      command: 'bun run --cwd backend dev',
      port: 3000,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'bun run --cwd frontend dev',
      url: 'http://localhost:5173',
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
