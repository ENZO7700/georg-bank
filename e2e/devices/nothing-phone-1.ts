import type { devices as PlaywrightDevices } from '@playwright/test'

type DeviceDescriptor = (typeof PlaywrightDevices)[string]

/**
 * Nothing Phone (1) — 6.55" FHD+ 1080×2400 OLED (~402 ppi).
 * CSS viewport ≈ 412×915 @ deviceScaleFactor 2.625 (same class as Pixel 6).
 */
export const nothingPhone1: DeviceDescriptor = {
  userAgent:
    'Mozilla/5.0 (Linux; Android 13; A063) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 2.625,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: 'chromium',
}

export const NOTHING_PHONE_1_VIEWPORT = {
  width: 412,
  height: 915,
  dpr: 2.625,
} as const
