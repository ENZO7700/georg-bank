import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { openNewPaymentFromMenu } from './helpers/app'

test.describe('George Smoke Test – platba a HTML potvrdenie', () => {
  test('Kompletný platobný flow a stiahnutie HTML potvrdenia', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/dashboard/)

    await openNewPaymentFromMenu(page)

    const testDataBtn = page.locator('button:has-text("Vyplniť testovacie údaje")').first()
    await expect(testDataBtn).toBeVisible({ timeout: 5000 })
    await testDataBtn.click()

    const submitBtn = page.getByRole('button', { name: /Podpísať platbu/i }).first()
    await expect(submitBtn).toBeVisible({ timeout: 5000 })

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await submitBtn.click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/\.html$/i)

    const tempPath = path.join(__dirname, '..', `tmp-smoke-${Date.now()}-${Math.random().toString(36).substring(7)}.html`)
    await download.saveAs(tempPath)
    expect(fs.existsSync(tempPath)).toBe(true)
    expect(fs.statSync(tempPath).size).toBeGreaterThan(100)
    fs.unlinkSync(tempPath)
  })
})