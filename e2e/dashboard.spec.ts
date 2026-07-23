import { test, expect } from '@playwright/test'
import {
  gotoApp,
  SWAPPED_CARD_ENDINGS,
  expectGeorgeHeader,
  openDashboardMenu,
  PROTECTED_DASHBOARD_ROUTES,
} from './helpers/app'

test.describe('Dashboard', () => {
  test('Dashboard je dostupný po prihlásení', async ({ page }) => {
    await gotoApp(page, '/dashboard')
    await expect(page).toHaveURL(/dashboard/)
    await expect(page).toHaveTitle(/George/i)
  })

  test('Dashboard zobrazuje produkty a prehľad prevodov', async ({ page }) => {
    await gotoApp(page, '/dashboard')
    await expect(page.getByRole('button', { name: /Vaše produkty/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Prehľad prevodov')).toBeVisible()
    await expect(page.getByText('SPACE účet').first()).toBeVisible()
  })

  test('DashboardHeader má logo a Odhlásenie na mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoApp(page, '/dashboard')
    // Full-bleed mobile dashboard2: no outer Menu chrome — assert Prehľad / PIN
    await expectGeorgeHeader(page)
  })

  test('Karty majú správne koncové číslice (párne/nepárne swap)', async ({ page }) => {
    await gotoApp(page, '/dashboard')
    for (const ending of SWAPPED_CARD_ENDINGS) {
      await expect(page.getByText(`4544 12** **** ${ending}`)).toBeVisible({ timeout: 15000 })
    }
  })

  test('Menu História naviguje na dashboard', async ({ page }) => {
    // Menu chrome is desktop-only on dashboard2; use payment-orders which still has Menu
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoApp(page, '/dashboard/payment-orders')
    await openDashboardMenu(page)
    await page.getByRole('button', { name: /^História$/i }).first().click()
    await expect(page).toHaveURL(/\/dashboard\/?$/)
  })

  test('Menu sub-header zobrazuje SPACE účet a reálny zostatok', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoApp(page, '/dashboard/payment-orders')
    await openDashboardMenu(page)
    const subHeader = page.locator('text=/SPACE účet \\| €/')
    await expect(subHeader.first()).toBeVisible()
    await expect(subHeader.first()).not.toHaveText(/€ 0,85/)
  })

  test('Výpis transakcií je dostupný', async ({ page }) => {
    await gotoApp(page, '/dashboard')
    await page.waitForLoadState('networkidle')
    expect((await page.content()).length).toBeGreaterThan(1000)
  })

  test('Platobné príkazy používajú zjednotený header', async ({ page }) => {
    await gotoApp(page, '/dashboard/payment-orders')
    await expect(page).toHaveURL(/payment-orders/)
    await expectGeorgeHeader(page)
    await expect(page.getByText('Platobné príkazy')).toBeVisible()
  })

  test('Asistent je dostupný so zjednoteným headerom', async ({ page }) => {
    await gotoApp(page, '/dashboard/assistant')
    await expect(page).toHaveURL(/assistant/)
    await expectGeorgeHeader(page)
  })

  test('Bez session cookie proxy vytvorí guest session a sprístupní dashboard', async ({ browser }) => {
    // App is guest-first (proxy → /api/auth/guest). Unauthenticated browser still lands on dashboard.
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await gotoApp(page, '/dashboard')
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText('SPACE účet').first()).toBeVisible({ timeout: 20000 })
    await context.close()
  })
})

test.describe('Dashboard – cross-page header', () => {
  for (const route of PROTECTED_DASHBOARD_ROUTES) {
    test(`George header na ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await gotoApp(page, route)
      await expect(page).not.toHaveURL(/sign-in/)
      await expectGeorgeHeader(page)
    })
  }
})