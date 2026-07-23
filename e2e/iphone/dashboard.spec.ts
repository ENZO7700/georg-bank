import { test, expect } from '@playwright/test'
import {
  SWAPPED_CARD_ENDINGS,
  expectGeorgeHeader,
  openDashboardMenu,
  PROTECTED_DASHBOARD_ROUTES,
} from '../helpers/app'
import {
  expectElementFitsViewport,
  expectNoHorizontalOverflow,
  expectPortraitViewport,
  expectTapTargetMinSize,
} from '../helpers/iphone-mobile'

test.describe('iPhone – Dashboard', () => {
  test('dashboard-001: available after login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/dashboard/)
    await expect(page).toHaveTitle(/George/i)
  })

  test('dashboard-002: portrait viewport matches modern iPhone preset', async ({ page }) => {
    await page.goto('/dashboard')
    // iPhone 17 Pro: 402, iPhone Air: 420 CSS px
    await expectPortraitViewport(page, 390, 430)
    await expectNoHorizontalOverflow(page)
  })

  test('dashboard-003: George header 3-zone layout', async ({ page }) => {
    await page.goto('/dashboard')
    await expectGeorgeHeader(page)
    await expectElementFitsViewport(page, page.locator('header').first())
  })

  test('dashboard-004: Menu and Odhlásenie tap targets', async ({ page }) => {
    await page.goto('/dashboard')
    const header = page.locator('header').first()
    await expectTapTargetMinSize(header.getByRole('button', { name: /^Menu$/i }))
    await expectTapTargetMinSize(header.getByRole('button', { name: /Odhlás/i }))
  })

  test('dashboard-005: products and transfers sections', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: /Vaše produkty/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Prehľad prevodov')).toBeVisible()
    await expect(page.getByText('SPACE účet').first()).toBeVisible()
  })

  test('dashboard-006: card number masking', async ({ page }) => {
    await page.goto('/dashboard')
    for (const ending of SWAPPED_CARD_ENDINGS) {
      await expect(page.getByText(`4544 12** **** ${ending}`)).toBeVisible({ timeout: 15000 })
    }
  })

  test('dashboard-007: menu overlay fits viewport', async ({ page }) => {
    await page.goto('/dashboard')
    await openDashboardMenu(page)
    const history = page.getByRole('button', { name: /^História$/i }).first()
    await expect(history).toBeVisible()
    await expectElementFitsViewport(page, history)
    await expectNoHorizontalOverflow(page)
  })

  test('dashboard-008: menu shows SPACE účet and live balance', async ({ page }) => {
    await page.goto('/dashboard')
    await openDashboardMenu(page)
    const subHeader = page.locator('text=/SPACE účet \\| €/')
    await expect(subHeader.first()).toBeVisible()
    await expect(subHeader.first()).not.toHaveText(/€ 0,85/)
  })

  test('dashboard-009: menu História navigates home', async ({ page }) => {
    await page.goto('/dashboard/payment-orders')
    await openDashboardMenu(page)
    await page.getByRole('button', { name: /^História$/i }).first().click()
    await expect(page).toHaveURL(/\/dashboard\/?$/)
  })

  test('dashboard-010: payment-orders with unified header', async ({ page }) => {
    await page.goto('/dashboard/payment-orders')
    await expect(page).toHaveURL(/payment-orders/)
    await expectGeorgeHeader(page)
    await expect(page.getByText('Platobné príkazy')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('dashboard-011: assistant with unified header', async ({ page }) => {
    await page.goto('/dashboard/assistant')
    await expect(page).toHaveURL(/assistant/)
    await expectGeorgeHeader(page)
    await expectNoHorizontalOverflow(page)
  })

  test('dashboard-012: no horizontal overflow on long content', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await expectNoHorizontalOverflow(page)
  })

  for (const route of PROTECTED_DASHBOARD_ROUTES) {
    test(`dashboard-header: George header on ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page).not.toHaveURL(/sign-in/)
      await expectGeorgeHeader(page)
      await expectNoHorizontalOverflow(page)
    })
  }
})
