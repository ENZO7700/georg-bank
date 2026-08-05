/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const GEORGE_URL = process.env.GEORGE_URL ?? 'https://george-91165977.vercel.app'
const POHYBY_URL = process.env.POHYBY_URL ?? 'https://pohyby-408735.vercel.app'

export default defineConfig({
  testDir: './e2e',
  testMatch: /prod-safari-smoke\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120000,

  use: {
    // Base for relative helpers; smoke uses absolute GEORGE_URL / POHYBY_URL.
    baseURL: GEORGE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 25000,
    navigationTimeout: 45000,
    storageState: { cookies: [], origins: [] },
    extraHTTPHeaders: {
      'X-Tailscale-User-Login': 'playwright-e2e',
    },
  },

  projects: [
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    {
      // Headed WebKit mobile viewport (Playwright device preset — not iOS Simulator)
      name: 'iPhone 17 Pro',
      use: {
        ...devices['iPhone 17 Pro'],
        headless: false,
      },
    },
  ],

  metadata: {
    GEORGE_URL,
    POHYBY_URL,
  },
})
