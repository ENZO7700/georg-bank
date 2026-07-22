import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { loginWithPin } from './helpers/dashboard2'

/**
 * E2E: vyplnenie platby na /dashboard2 → Autorizovať cez George kľúč
 * → stiahnutie HTML potvrdenia s údajmi o platbe.
 */
const PAYMENT = {
  recipient: 'Mária Nováková',
  iban: 'SK8090000000001234567890',
  amount: '0.25',
  vs: '20260717',
  note: 'Test HTML',
} as const

test.describe('dashboard2 – vyplnenie platby + HTML potvrdenie', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('vyplní platbu, autorizuje George kľúčom a overí HTML s údajmi', async ({ page }) => {
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

    // 1) Login (PIN 2366)
    await loginWithPin(page)

    // 2) Otvor Nová platba
    await page.getByRole('button', { name: /Nová platba/i }).click()
    await expect(page.getByRole('heading', { name: 'Nová platba' })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#pay-recipient')).toBeVisible()

    // 3) Vyplň formulár (suma < 0.53 € default balance)
    await page.locator('#pay-recipient').fill(PAYMENT.recipient)
    await page.locator('#pay-iban').fill(PAYMENT.iban)
    await page.locator('#pay-amount').fill(PAYMENT.amount)
    await page.locator('#pay-vs').fill(PAYMENT.vs)
    await page.locator('#pay-note').fill(PAYMENT.note)

    await expect(page.locator('#pay-recipient')).toHaveValue(PAYMENT.recipient)
    await expect(page.locator('#pay-iban')).toHaveValue(PAYMENT.iban)
    await expect(page.locator('#pay-amount')).toHaveValue(PAYMENT.amount)
    await expect(page.locator('#pay-vs')).toHaveValue(PAYMENT.vs)
    await expect(page.locator('#pay-note')).toHaveValue(PAYMENT.note)

    // 4) Autorizácia → download HTML
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 })
    await page.getByRole('button', { name: /Autorizovať cez George kľúč/i }).click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/^potvrdenie-.*\.html$/i)
    expect(filename).toContain(PAYMENT.vs)

    const tempPath = path.join(
      __dirname,
      '..',
      `tmp-payment-html-${Date.now()}-${Math.random().toString(36).slice(2)}.html`
    )
    await download.saveAs(tempPath)
    expect(fs.existsSync(tempPath)).toBe(true)
    expect(fs.statSync(tempPath).size).toBeGreaterThan(500)

    // 5) Over obsah HTML dokumentu
    const html = fs.readFileSync(tempPath, 'utf8')
    expect(html).toMatch(/<!DOCTYPE html>/i)
    expect(html).toMatch(/<html/i)
    expect(html).toMatch(/Mária Nováková|Maria Novakova/i)
    // suma 0.25 → v HTML typicky 0,25 alebo 0.25
    expect(html).toMatch(/0[,.]25/)
    // IBAN (s medzerami alebo bez)
    expect(html.replace(/\s+/g, '')).toMatch(/SK8090000000001234567890/i)
    // poznámka v tele potvrdenia
    expect(html).toMatch(/Test HTML/)
    // štruktúra potvrdenia
    expect(html.length).toBeGreaterThan(1000)

    fs.unlinkSync(tempPath)

    // 6) UI potvrdí úspech
    await expect(page.getByText(/úspešne odoslaná|Platba 0[,.]25/i).first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('prázdny formulár nespustí download', async ({ page }) => {
    await page.addInitScript(() => {
      const nav = navigator as Navigator & { canShare?: () => boolean }
      nav.canShare = () => false
    })

    await loginWithPin(page)

    await page.getByRole('button', { name: /Nová platba/i }).click()
    await page.getByRole('button', { name: /Autorizovať cez George kľúč/i }).click()

    // Toast validácie, žiadny download
    await expect(page.getByText(/vyplňte správne|Prosím/i).first()).toBeVisible({ timeout: 10000 })
  })
})
