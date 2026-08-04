import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { loginWithPin } from './helpers/dashboard2'

/**
 * E2E: vyplnenie platby na /dashboard2 → Autorizovať cez George kľúč
 * → PDF potvrdenie (+ sandbox doklady).
 */
const PAYMENT = {
  recipient: 'Mária Nováková',
  iban: 'SK8090000000001234567890',
  amount: '0.25',
  vs: '20260717',
  note: 'Test HTML',
} as const

test.describe('dashboard2 – vyplnenie platby + PDF potvrdenie', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('vyplní platbu, autorizuje George kľúčom a overí PDF download', async ({ page }) => {
    // Force <a download> (bez Web Share sheetu v headless)
    await page.addInitScript(() => {
      const nav = navigator as Navigator & {
        canShare?: (d?: ShareData) => boolean
        share?: () => Promise<void>
      }
      nav.canShare = () => false
      nav.share = async () => {
        throw new Error('share disabled in e2e')
      }
    })

    await loginWithPin(page)

    await expect(page.getByTestId('receipts-sandbox')).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Nová platba/i }).click()
    await expect(page.getByRole('heading', { name: 'Nová platba' })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#pay-recipient')).toBeVisible()

    await page.locator('#pay-recipient').fill(PAYMENT.recipient)
    await page.locator('#pay-iban').fill(PAYMENT.iban)
    await page.locator('#pay-amount').fill(PAYMENT.amount)
    await page.locator('#pay-vs').fill(PAYMENT.vs)
    await page.locator('#pay-note').fill(PAYMENT.note)

    const downloadPromise = page.waitForEvent('download', { timeout: 45000 })
    await page.getByRole('button', { name: /Autorizovať cez George kľúč/i }).click()

    // Overlay + toast appear right after DB write — assert before long PDF convert.
    await expect(page.getByTestId('pdf-generate-overlay')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/Platba 0[,.]25|zapísaná/i).first()).toBeVisible({
      timeout: 10000,
    })

    const download = await downloadPromise
    const filename = download.suggestedFilename()
    // Prefer PDF; HTML fallback is still acceptable if canvas fails in CI.
    expect(filename).toMatch(/^potvrdenie-.*\.(pdf|html)$/i)
    expect(filename).toContain(PAYMENT.vs)

    const ext = filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html'
    const tempPath = path.join(
      __dirname,
      '..',
      `tmp-payment-${ext}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    )
    await download.saveAs(tempPath)
    expect(fs.existsSync(tempPath)).toBe(true)
    const size = fs.statSync(tempPath).size
    expect(size).toBeGreaterThan(500)

    if (ext === 'pdf') {
      const magic = fs.readFileSync(tempPath).subarray(0, 4).toString('utf8')
      expect(magic).toBe('%PDF')
    } else {
      const html = fs.readFileSync(tempPath, 'utf8')
      expect(html).toMatch(/<!DOCTYPE html>/i)
      expect(html).toMatch(/Mária Nováková|Maria Novakova/i)
      expect(html).toMatch(/0[,.]25/)
    }

    fs.unlinkSync(tempPath)

    await expect(page.getByTestId('pdf-generate-overlay')).toBeHidden({ timeout: 15000 })

    await expect(
      page.getByTestId('receipts-sandbox-list').getByText(PAYMENT.recipient).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('prázdny formulár nespustí download', async ({ page }) => {
    await page.addInitScript(() => {
      const nav = navigator as Navigator & { canShare?: () => boolean }
      nav.canShare = () => false
    })

    await loginWithPin(page)

    await page.getByRole('button', { name: /Nová platba/i }).click()
    await page.getByRole('button', { name: /Autorizovať cez George kľúč/i }).click()

    await expect(page.getByText(/vyplňte správne|Prosím/i).first()).toBeVisible({ timeout: 10000 })
  })
})
