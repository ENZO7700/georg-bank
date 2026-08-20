import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { loginWithPin } from './helpers/dashboard2'
import { DEMO_ACCOUNT_NUMBER, LEGACY_FAKE_SENDER_IBAN } from '../lib/demo-user'

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

  test('Nová platba sheet je hneď vo viewporte (100dvh, bez scrollu)', async ({ page }) => {
    await loginWithPin(page)
    await expect(page.getByRole('heading', { name: 'Prehľad', exact: true })).toBeVisible()

    const scrollBefore = await page.evaluate(() => window.scrollY)
    await page.getByRole('button', { name: /Nová platba/i }).click()

    const sheet = page.getByTestId('payment-sheet')
    const panel = page.getByTestId('payment-sheet-panel')
    const heading = page.getByRole('heading', { name: 'Nová platba' })

    await expect(sheet).toBeVisible({ timeout: 10000 })
    await expect(heading).toBeVisible()

    const vp = page.viewportSize()
    expect(vp).toBeTruthy()
    const headingBox = await heading.boundingBox()
    const panelBox = await panel.boundingBox()
    expect(headingBox).toBeTruthy()
    expect(panelBox).toBeTruthy()
    expect(headingBox!.y).toBeGreaterThanOrEqual(0)
    expect(headingBox!.y).toBeLessThan(vp!.height)
    // Full-height bottom sheet (~100dvh)
    expect(panelBox!.height).toBeGreaterThan(vp!.height * 0.9)
    // Opening must not require page scroll to discover the sheet
    const scrollAfter = await page.evaluate(() => window.scrollY)
    expect(scrollAfter).toBe(scrollBefore)
  })

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
    const persistPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/api/transactions') &&
        r.request().method() === 'POST' &&
        r.status() < 500,
      { timeout: 45000 }
    )

    await page.getByRole('button', { name: /Autorizovať cez George kľúč/i }).click()

    // Overlay + toast appear right after DB write — assert before long PDF convert.
    await expect(page.getByTestId('pdf-generate-overlay')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/Platba 0[,.]25|zapísaná/i).first()).toBeVisible({
      timeout: 10000,
    })

    const [download, persistRes] = await Promise.all([downloadPromise, persistPromise])
    expect(persistRes.ok(), `POST /api/transactions → ${persistRes.status()}`).toBe(true)
    const persistBody = (await persistRes.json().catch(() => null)) as {
      success?: boolean
      transaction?: { id?: string }
    } | null
    expect(persistBody?.success).toBe(true)
    const txnId = persistBody?.transaction?.id
    expect(txnId).toBeTruthy()

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
      const compact = html.replace(/\s+/g, '')
      expect(html).toMatch(/<!DOCTYPE html>/i)
      expect(html).toMatch(/Mária Nováková|Maria Novakova/i)
      expect(html).toMatch(/0[,.]25/)
      expect(compact).toContain(DEMO_ACCOUNT_NUMBER)
      expect(compact).not.toContain(LEGACY_FAKE_SENDER_IBAN)
      expect(compact).toContain(PAYMENT.iban)
    }

    // Server-rendered confirmation must use real sender IBAN (covers PDF path too).
    const confRes = await page.request.get(
      `/api/export/payment-confirmation?transactionId=${encodeURIComponent(txnId!)}`
    )
    expect(confRes.ok()).toBe(true)
    const confHtml = await confRes.text()
    const confCompact = confHtml.replace(/\s+/g, '')
    expect(confCompact).toContain(DEMO_ACCOUNT_NUMBER)
    expect(confCompact).not.toContain(LEGACY_FAKE_SENDER_IBAN)
    expect(confCompact).toContain(PAYMENT.iban)
    expect(confHtml).toContain(PAYMENT.recipient)

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
