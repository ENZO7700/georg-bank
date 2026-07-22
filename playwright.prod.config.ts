import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'https://george-dev.vercel.app'

export default defineConfig({
  testDir: './e2e',
  testMatch: /(production-check|statement-generator)\.spec\.ts/,
  retries: 1,
  reporter: [['list']],
  timeout: 90000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 30000,
    extraHTTPHeaders: {
      'X-Tailscale-User-Login': 'playwright-e2e',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})