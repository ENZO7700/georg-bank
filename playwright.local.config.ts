import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: /(production-check|statement-generator)\.spec\.ts/,
  retries: 0,
  reporter: [['list']],
  timeout: 90000,
  use: {
    baseURL: 'http://localhost:3030',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})