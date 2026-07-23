import { test, expect } from '@playwright/test'
import { loginWithPin } from '../helpers/dashboard2'
import {
  expectNoHorizontalOverflow,
  expectTapTargetMinSize,
  expectViewportMeta,
} from '../helpers/iphone-mobile'
import { NOTHING_PHONE_1_VIEWPORT } from '../devices/nothing-phone-1'

/**
 * Rýchly smoke pre Nothing Phone (1) viewport (Android Chromium emulation).
 */
test.describe('Nothing Phone 1 – smoke', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('viewport matches Nothing Phone 1 CSS size', async ({ page }) => {
    const vp = page.viewportSize()
    expect(vp?.width).toBe(NOTHING_PHONE_1_VIEWPORT.width)
    expect(vp?.height).toBe(NOTHING_PHONE_1_VIEWPORT.height)
  })

  test('legacy /dashboard redirects to /dashboard2', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/dashboard2/, { timeout: 20000 })
    await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({ timeout: 20000 })
  })

  test('dashboard2 PIN → Prehľad, Menu touch target, no H-overflow', async ({ page }) => {
    await loginWithPin(page, '666666')

    await expect(page.getByRole('heading', { name: 'Prehľad', exact: true })).toBeVisible()
    await expectViewportMeta(page)
    await expectNoHorizontalOverflow(page)

    const menu = page.getByRole('button', { name: /Menu/i }).first()
    await expect(menu).toBeVisible()
    // Android Material often 48dp; allow 44 as shared mobile floor
    await expectTapTargetMinSize(menu, 44)

    await expect(page.getByRole('button', { name: /Nová platba/i })).toBeVisible()
    await expect(page.locator('#payment-history')).toBeVisible()
  })

  test('Nová platba sheet opens and fits viewport width', async ({ page }) => {
    await loginWithPin(page, '666666')

    await page.getByRole('button', { name: /Nová platba/i }).click()
    await expect(page.getByRole('heading', { name: 'Nová platba' })).toBeVisible({
      timeout: 10000,
    })

    const recipient = page.locator('#pay-recipient')
    await expect(recipient).toBeVisible()
    const box = await recipient.boundingBox()
    const vp = page.viewportSize()
    expect(box).toBeTruthy()
    expect(vp).toBeTruthy()
    if (box && vp) {
      expect(box.width).toBeLessThanOrEqual(vp.width + 1)
      expect(box.x).toBeGreaterThanOrEqual(-1)
    }
    await expectNoHorizontalOverflow(page)
  })
})
