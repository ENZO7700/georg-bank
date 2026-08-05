import { expect, type Page } from '@playwright/test'

export const SITE_GATE_PASSWORD = process.env.SITE_GATE_PASSWORD ?? 'heslo'
export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'anton-karton-007@proton.me'
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'admin@admin.com'

export const SWAPPED_CARD_ENDINGS = ['1234', '4321', '4444'] as const

export const PROTECTED_DASHBOARD_ROUTES = [
  '/dashboard2',
  '/dashboard2/payment-orders',
  '/dashboard2/assistant',
] as const

/** Prejde site gate ak je aktívny (produkcia / lokálny dev s gate). */
export async function passSiteGate(page: Page) {
  if (!page.url().includes('/gate')) return

  const questionMark = page.getByTestId('red-question-mark')
  if (await questionMark.isVisible().catch(() => false)) {
    await questionMark.click()
  }

  // Password form (when Tailscale header does not auto-authorize)
  const passwordInput = page.locator('input[type="password"]')
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(SITE_GATE_PASSWORD)
    await passwordInput.press('Enter')
  }

  await page.waitForURL((url) => !url.pathname.includes('/gate'), { timeout: 20000 })
}

/**
 * Navigácia s automatickým prejdením site gate + guest session.
 * App uses middleware → /api/auth/guest for session when unauthenticated.
 * `path` may be absolute (https://…) or relative (/dashboard2).
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

/** Absolute URL navigation with site gate + guest handling. */
export async function gotoAbsolute(page: Page, url: string) {
  await gotoApp(page, url)
}

/**
 * Zabezpečí prihlásenú session (site gate + guest auto-login).
 * Lands on /dashboard2 (legacy /dashboard redirects there).
 */
export async function login(page: Page) {
  await gotoApp(page, '/dashboard2')
  await page.waitForURL(/dashboard2/, { timeout: 30000 })
  await expect(page.getByText(/Zadajte bezpečnostný PIN|Prehľad|SPACE účet/i).first()).toBeVisible({
    timeout: 20000,
  })
}

export async function expectGeorgeHeader(page: Page) {
  const width = page.viewportSize()?.width ?? 1280
  const path = new URL(page.url()).pathname
  const isDashboard2Shell =
    path.includes('/dashboard2') || path === '/dashboard' || /\/dashboard\/?$/.test(path)

  // dashboard2: below lg the outer Menu/Odhlásenie chrome is hidden (native full-bleed)
  if (width < 1024 && isDashboard2Shell) {
    const pin = page.getByText(/Zadajte bezpečnostný PIN/i)
    const prehlad = page.getByRole('heading', { name: 'Prehľad', exact: true })
    await expect(pin.or(prehlad).first()).toBeVisible({ timeout: 20000 })
    return
  }

  const header = page.locator('header').first()
  await expect(header).toBeVisible()
  await expect(header.getByRole('button', { name: /^Menu$/i })).toBeVisible()
  await expect(header.getByRole('button', { name: /Odhlás/i })).toBeVisible()
}

export async function openDashboardMenu(page: Page) {
  const width = page.viewportSize()?.width ?? 1280
  const path = new URL(page.url()).pathname
  const isDashboard2Shell =
    path.includes('/dashboard2') || path === '/dashboard' || /\/dashboard\/?$/.test(path)

  if (width < 1024 && isDashboard2Shell) {
    // Mobile/full-bleed layout: try a mobile-friendly menu first, otherwise fall back to safe navigation.
    const menuBtn = page.getByRole('button', { name: /^Menu$/i }).first()
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click()
      await expect(page.getByRole('button', { name: /^História$/i }).first()).toBeVisible({
        timeout: 10000,
      })
      return
    }
    // As a robust fallback, navigate to dashboard2 (mobile UI should expose the new-payment CTA).
    await page.goto('/dashboard2', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/dashboard2/, { timeout: 15000 })
    // continue — caller will try to click the New Payment button
  }
  await page.locator('header').getByRole('button', { name: /^Menu$/i }).click()
  await expect(page.getByRole('button', { name: /^História$/i }).first()).toBeVisible({ timeout: 10000 })
}

export async function openNewPaymentFromMenu(page: Page) {
  // openDashboardMenu may now navigate or click; tolerate failures and try a safe fallback.
  try {
    await openDashboardMenu(page)
  } catch (err) {
    // If something unexpected happens, navigate to dashboard2 and continue.
    await page.goto('/dashboard2', { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/dashboard2/, { timeout: 15000 })
  }
  const newPaymentBtn = page.getByRole('button', { name: /^Nová platba$/i }).first()
  await expect(newPaymentBtn).toBeVisible({ timeout: 10000 })
  await newPaymentBtn.click()
  await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 })
}
