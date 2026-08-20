import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.GEORGE_URL ?? 'https://george-dev-viandmos-projects.vercel.app'

export default defineConfig({
  testDir: './e2e',
  testMatch: /prod-safari-smoke\.spec\.ts/,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 120000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 25000,
    navigationTimeout: 45000,
    extraHTTPHeaders: {
      // Bypass site gate when SITE_GATE_ENABLED=true (guest session still required).
      'X-Tailscale-User-Login': 'playwright-e2e',
    },
    ...devices['Desktop Chrome'],
  },
})
