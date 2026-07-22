import { expect, type Page } from '@playwright/test'

export const SITE_GATE_PASSWORD = process.env.SITE_GATE_PASSWORD ?? 'heslo'
export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'anton-karton-007@proton.me'
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin@admin.com'

export const SWAPPED_CARD_ENDINGS = ['1234', '4321', '4444'] as const

export const PROTECTED_DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboardpayment',
  '/dashboard/payment-orders',
  '/dashboard/assistant',
] as const

/** Prejde site gate ak je aktívny (produkcia / lokálny dev s gate). */
export async function passSiteGate(page: Page) {
  if (!page.url().includes('/gate')) return

  const questionMark = page.getByTestId('red-question-mark')
  if (await questionMark.isVisible().catch(() => false)) {
    await questionMark.click()
  }
  await page.waitForURL((url) => !url.pathname.includes('/gate'), { timeout: 15000 })
}

/**
 * Navigácia s automatickým prejdením site gate + guest session.
 * App uses middleware → /api/auth/guest for session when unauthenticated.
 */
export async function gotoApp(page: Page, path: string) {
  await page.goto(path, { timeout: 45000, waitUntil: 'domcontentloaded' })
  await passSiteGate(page)

  // Guest auth: middleware may redirect to /api/auth/guest then back.
  await page.waitForURL(
    (url) => !url.pathname.includes('/gate') && !url.pathname.includes('/api/auth/guest'),
    { timeout: 30000 }
  )
}

/**
 * Zabezpečí prihlásenú session (site gate + guest auto-login).
 * Sign-in/sign-up pages redirect to /dashboard; real auth is guest middleware.
 */
export async function login(page: Page) {
  await gotoApp(page, '/dashboard')
  await page.waitForURL(/dashboard/, { timeout: 30000 })
  await expect(page.getByText('SPACE účet').first()).toBeVisible({ timeout: 20000 })
}

export async function expectGeorgeHeader(page: Page) {
  const header = page.locator('header').first()
  await expect(header).toBeVisible()
  await expect(header.getByRole('button', { name: /^Menu$/i })).toBeVisible()
  await expect(header.getByRole('button', { name: /Odhlás/i })).toBeVisible()
}

export async function openDashboardMenu(page: Page) {
  await page.locator('header').getByRole('button', { name: /^Menu$/i }).click()
  await expect(page.getByRole('button', { name: /^História$/i }).first()).toBeVisible({ timeout: 10000 })
}

export async function openNewPaymentFromMenu(page: Page) {
  await openDashboardMenu(page)
  const newPaymentBtn = page.getByRole('button', { name: /^Nová platba$/i }).first()
  await expect(newPaymentBtn).toBeVisible({ timeout: 10000 })
  await newPaymentBtn.click()
  await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 })
}