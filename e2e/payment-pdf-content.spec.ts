import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { openNewPaymentFromMenu } from './helpers/app'

test.describe('Payment confirmation – HTML obsah a API', () => {
  test('Odoslanie platby s unikátnymi údajmi a verifikácia HTML + API', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/dashboard/)

    await openNewPaymentFromMenu(page)

    const uniqueNote = `Unikatna platba pre SLSP - ${Date.now()}`
    const testRecipient = 'Juraj Janosik'
    const testIban = 'SK9909000000000012345678'
    const testAmount = '15.50'

    await page.locator('input#recipient').fill(testRecipient)
    await page.locator('input#iban').fill(testIban)
    await page.locator('input#amount').fill(testAmount)
    await page.locator('input#note').fill(uniqueNote)

    const submitBtn = page.getByRole('button', { name: /Podpísať platbu/i }).first()
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await submitBtn.click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.html$/i)

    const tempPath = path.join(__dirname, '..', `tmp-special-${Date.now()}-${Math.random().toString(36).substring(7)}.html`)
    await download.saveAs(tempPath)
    expect(fs.existsSync(tempPath)).toBe(true)

    const normalizedText = fs.readFileSync(tempPath, 'utf8').replace(/\s+/g, ' ')
    expect(normalizedText).toContain('Štandardný platobný príkaz')
    expect(normalizedText).toContain(testRecipient)
    expect(normalizedText).toContain(uniqueNote)
    expect(normalizedText).toContain('15,50')

    await page.locator('button:has-text("Hotovo")').first().click()
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const txnButton = page.locator('button').filter({ hasText: uniqueNote }).first()
    await expect(txnButton).toBeVisible({ timeout: 15000 })
    await txnButton.click()
    await expect(page.getByText('Detail transakcie')).toBeVisible({ timeout: 5000 })

    const transactionId = await page
      .getByText('ID transakcie', { exact: true })
      .locator('xpath=following-sibling::span[1]')
      .textContent()

    expect(transactionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )

    const receiptHref = `/api/export/payment-confirmation?transactionId=${encodeURIComponent(transactionId!.trim())}`
    const apiResponse = await page.request.get(receiptHref)
    expect(apiResponse.ok()).toBeTruthy()
    expect(apiResponse.headers()['content-type']).toContain('text/html')

    const normalizedApiHtml = (await apiResponse.text()).replace(/\s+/g, ' ')
    expect(normalizedApiHtml).toContain('Štandardný platobný príkaz')
    expect(normalizedApiHtml).toContain(testRecipient)
    expect(normalizedApiHtml).toContain(uniqueNote)
    expect(normalizedApiHtml.replace(/\s/g, '')).toContain(testIban.replace(/\s/g, ''))
    expect(normalizedApiHtml).toContain('15,50')

    fs.unlinkSync(tempPath)
  })
})