import { test, expect } from '@playwright/test'
import { gotoApp, login } from './helpers/app'

/**
 * Auth flow (current product):
 * - Guest auto-login via proxy → /api/auth/guest
 * - /sign-in and /sign-up redirect to /dashboard2 (simulator welcome)
 */
test.describe('Autentifikácia', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('Sign-in presmeruje na dashboard2 welcome', async ({ page }) => {
    await gotoApp(page, '/sign-in')
    await expect(page).toHaveURL(/dashboard2/)
    await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({
      timeout: 15000,
    })
  })

  test('Sign-up presmeruje na dashboard2 welcome', async ({ page }) => {
    await gotoApp(page, '/sign-up')
    await expect(page).toHaveURL(/dashboard2/)
    await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({
      timeout: 15000,
    })
  })

  test('Root (/) presmeruje na dashboard2', async ({ page }) => {
    await gotoApp(page, '/')
    await expect(page).toHaveURL(/dashboard2/)
    await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({
      timeout: 15000,
    })
  })

  test('Guest session sprístupní klasický /dashboard2', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/dashboard2/)
    await expect(page.getByText('SPACE účet').first()).toBeVisible({ timeout: 15000 })
  })
})
