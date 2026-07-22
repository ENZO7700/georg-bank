import { test, expect } from '@playwright/test'
import { enterPin, loginWithPin } from './helpers/dashboard2'

/**
 * Po Autorizovať cez George kľúč sa transakcia zobrazí v histórii na Prehľade
 * s detailom (note, IBAN, VS) – ako v starom dashboarde.
 */
test.describe('dashboard2 – história platieb po autorizácii', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    // Disable Web Share so download event is deterministic
    await page.addInitScript(() => {
      const nav = navigator as Navigator & { canShare?: () => boolean; share?: () => Promise<void> }
      nav.canShare = () => false
      nav.share = async () => {
        throw new Error('share disabled in e2e')
      }
    })
  })

  async function clearGeorgeStorage(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
      // Only wipe once per document load when flag not set — reload persistence test
      // sets sessionStorage flag so history survives.
      try {
        if (!sessionStorage.getItem('e2e_keep_george_state')) {
          localStorage.removeItem('george_pwa_state')
        }
      } catch {
        /* ignore */
      }
    })
  }

  test('platba sa objaví v histórii a v detaile má note/iban/vs', async ({ page }) => {
    await clearGeorgeStorage(page)
    await loginWithPin(page)

    await expect(page.locator('#payment-history')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Prehľad prevodov' })).toBeVisible()

    // Unique recipient so DB-persisted retries don't collide
    const recipient = `História ${Date.now().toString(36)}`
    await page.getByRole('button', { name: /Nová platba/i }).click()
    await page.locator('#pay-recipient').fill(recipient)
    await page.locator('#pay-iban').fill('SK8090000000001234567890')
    await page.locator('#pay-amount').fill('0.15')
    await page.locator('#pay-vs').fill('998877')
    await page.locator('#pay-note').fill('Poznámka hist')

    const downloadPromise = page.waitForEvent('download', { timeout: 20000 })
    await page.getByRole('button', { name: /Autorizovať cez George kľúč/i }).click()
    await downloadPromise

    // História – nový riadok hore (exact title only; IBAN subtitle also contains name)
    const history = page.locator('#payment-history')
    await expect(history.getByText(recipient, { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(history.getByText(/0[,.]15/).first()).toBeVisible()

    // Filter Odoslané
    await page.getByRole('button', { name: 'Odoslané', exact: true }).click()
    await expect(history.getByText(recipient, { exact: true })).toBeVisible()

    // Detail
    await history.getByText(recipient, { exact: true }).click()
    const detail = page.locator('#txn-detail-modal')
    await expect(detail.getByText('Detail prevodu')).toBeVisible()
    await expect(detail.getByText('Poznámka hist')).toBeVisible()
    await expect(detail.getByText(/SK80|1234567890/i)).toBeVisible()
    await expect(detail.getByText('998877')).toBeVisible()
    await expect(detail.getByTestId('txn-download-receipt')).toBeVisible()
  })

  test('história prežije reload (localStorage / DB)', async ({ page }) => {
    // Unique name per run — payments also persist to DB, so shared labels collide on retry
    const recipient = `Persist ${Date.now().toString(36)}`

    // Keep LS across reload (do not wipe in init scripts after this flag is set)
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('e2e_keep_george_state', '1')
      } catch {
        /* ignore */
      }
    })

    // Clear storage on real origin first
    await page.goto('/dashboard2', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.removeItem('george_pwa_state')
      sessionStorage.setItem('e2e_keep_george_state', '1')
    })

    await loginWithPin(page)

    await page.getByRole('button', { name: /Nová platba/i }).click()
    await page.locator('#pay-recipient').fill(recipient)
    await page.locator('#pay-iban').fill('SK9009000000000054321098')
    await page.locator('#pay-amount').fill('0.08')

    // After reload, list may come from API where description embeds IBAN after the name.
    // Match unique recipient as a prefix, not exact-only.
    const historyRow = page.locator('#payment-history').getByText(recipient).first()

    const downloadPromise = page.waitForEvent('download', { timeout: 20000 })
    const postPromise = page
      .waitForResponse(
        (res) =>
          res.url().includes('/api/transactions') &&
          res.request().method() === 'POST' &&
          res.ok(),
        { timeout: 15000 }
      )
      .catch(() => null)

    await page.getByRole('button', { name: /Autorizovať cez George kľúč/i }).click()
    await downloadPromise
    await postPromise
    await expect(historyRow).toBeVisible({ timeout: 10000 })

    // Ensure localStorage save effect flushed (fallback when DB is empty)
    await page.waitForTimeout(400)
    const stored = await page.evaluate(() => localStorage.getItem('george_pwa_state'))
    expect(stored).toBeTruthy()
    expect(stored!).toContain(recipient)

    await page.reload({ waitUntil: 'domcontentloaded' })
    // po reload treba znova PIN (isSimulatorLoggedIn nie je persistovaný)
    await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({ timeout: 15000 })
    await enterPin(page, '2366')

    await expect(page.getByRole('heading', { name: 'Prehľad', exact: true })).toBeVisible({ timeout: 15000 })
    // Prefer DB or localStorage — row title may be "Persist xxx" or "Persist xxx IBAN: …"
    await expect(
      page.locator('#payment-history').getByText(recipient).first()
    ).toBeVisible({ timeout: 15000 })
  })
})
