/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

// Load .env / .env.local so SITE_GATE_PASSWORD, TEST_USER_*, etc. work in E2E helpers.
loadEnvConfig(process.cwd())

const isProduction = !!process.env.BASE_URL
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3030'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: !isProduction, // serial in prod to avoid rate limits
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // CI: serial workers avoid guest-auth / DB pool flakiness across parallel suites
  workers: process.env.CI || isProduction ? 1 : 2,
  reporter: [['html'], ['list']],
  timeout: process.env.CI ? 90000 : 60000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      'X-Tailscale-User-Login': 'playwright-e2e',
    },
    // channel: 'chrome',
    // Extra time for production (network latency) and cold CI
    actionTimeout: process.env.CI || isProduction ? 20000 : 10000,
    navigationTimeout: process.env.CI || isProduction ? 30000 : 15000,
  },

  projects: [
    // Setup project – runs login once and stores session
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'production',
      testMatch: /production-check\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'chromium',
      testIgnore: [/production-check\.spec\.ts/, /iphone-14-plus\//, /iphone-17-air\//],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Chrome',
      testIgnore: [/production-check\.spec\.ts/, /iphone-14-plus\//, /iphone-17-air\//],
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Special device suites – only their own folders, official Playwright presets
    {
      name: 'iPhone 14 Plus',
      testMatch: /iphone-14-plus\/.*\.spec\.ts/,
      use: {
        ...devices['iPhone 14 Plus'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'iPhone 17 Air',
      testMatch: /iphone-17-air\/.*\.spec\.ts/,
      use: {
        // Playwright ships "iPhone Air" (iPhone 17 Air family)
        ...devices['iPhone Air'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Only start local server when NOT targeting production
  ...(isProduction
    ? {}
    : {
        webServer: {
          command: 'npm run build && npm run start',
          // Static asset returns 200 without auth/guest redirects (root may 307).
          url: 'http://localhost:3030/manifest.json',
          reuseExistingServer: true,
          timeout: 180000,
          env: {
            SITE_GATE_ENABLED: 'false',
            DISABLE_RATE_LIMIT: 'true',
          },
        },
      }),
})
