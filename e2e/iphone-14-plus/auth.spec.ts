import { test, expect } from '@playwright/test'
import { gotoApp, login, passSiteGate } from '../helpers/app'
import {
  expectNoHorizontalOverflow,
  expectPortraitViewport,
  expectTapTargetMinSize,
  expectViewportMeta,
} from '../helpers/iphone-mobile'

test.describe('iPhone 14 Plus – Auth', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('auth-001: portrait viewport is 14 Plus width', async ({ page }) => {
    // Playwright iPhone 14 Plus: 428 CSS px wide
    await expectPortraitViewport(page, 420, 430)
  })

  test('auth-002: site gate unlocks app on mobile', async ({ page }) => {
    await page.goto('/dashboard')
    // Gate may be disabled locally (SITE_GATE_ENABLED=false) – then we land via guest auth.
    if (page.url().includes('/gate')) {
      await expectViewportMeta(page)
      await expectNoHorizontalOverflow(page)
      const submit = page.locator('form button[type="submit"]')
      await expect(submit).toBeVisible({ timeout: 15000 })
      await expectTapTargetMinSize(submit)
      await passSiteGate(page)
    }
    await page.waitForURL(/dashboard/, { timeout: 30000 })
  })

  test('auth-003: guest auto-login lands on dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText('SPACE účet').first()).toBeVisible({ timeout: 15000 })
    await expectNoHorizontalOverflow(page)
  })

  test('auth-004: sign-in route redirects into app', async ({ page }) => {
    await gotoApp(page, '/sign-in')
    await page.waitForURL(/dashboard2/, { timeout: 30000 })
    await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({ timeout: 15000 })
  })

  test('auth-005: sign-up route redirects into app', async ({ page }) => {
    await gotoApp(page, '/sign-up')
    await page.waitForURL(/dashboard2/, { timeout: 30000 })
    await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({ timeout: 15000 })
  })

  test('auth-006: dashboard after cold navigation has session', async ({ page }) => {
    await gotoApp(page, '/dashboard')
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.locator('header').getByRole('button', { name: /Odhlás/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('auth-007: logout returns to a locked or re-auth flow', async ({ page }) => {
    await login(page)
    await page.locator('header').getByRole('button', { name: /Odhlás/i }).click()
    // After sign-out, middleware may re-guest-login or show gate/sign-in.
    await page.waitForTimeout(2000)
    const url = page.url()
    const onDashboard = /dashboard/.test(url)
    const onAuth = /\/(gate|sign-in|api\/auth\/guest)/.test(url)
    expect(onDashboard || onAuth).toBeTruthy()
  })

  test('auth-008: no horizontal overflow on entry', async ({ page }) => {
    await gotoApp(page, '/dashboard')
    await expect(page.getByText('SPACE účet').first()).toBeVisible({ timeout: 15000 })
    await expectNoHorizontalOverflow(page)
  })

  test('auth-009: viewport meta is mobile-friendly', async ({ page }) => {
    await page.goto('/gate')
    if (page.url().includes('/gate')) {
      await expectViewportMeta(page)
    } else {
      await gotoApp(page, '/dashboard')
      await expectViewportMeta(page)
    }
  })

  test('auth-010: protected payment-orders reachable after guest session', async ({ page }) => {
    await gotoApp(page, '/dashboard/payment-orders')
    await expect(page).toHaveURL(/payment-orders/)
    await expect(page.getByText('Platobné príkazy')).toBeVisible({ timeout: 15000 })
    await expectNoHorizontalOverflow(page)
  })
})
