import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { openNewPaymentFromMenu } from './helpers/app'

test.describe('Print Layout Validation', () => {
  test('HTML payment confirmation má A4 rozmery v print móde', async ({ page }) => {
    await page.goto('/dashboard2')
    await openNewPaymentFromMenu(page)

    await page.locator('input#recipient').fill('Test Layout')
    await page.locator('input#iban').fill('SK9909000000000012345678')
    await page.locator('input#amount').fill('10.00')

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await page.getByRole('button', { name: /Podpísať platbu/i }).first().click()

    const download = await downloadPromise
    const tempPath = path.join(__dirname, '..', `tmp-layout-test-${Date.now()}.html`)
    await download.saveAs(tempPath)
    const htmlText = fs.readFileSync(tempPath, 'utf8')
    fs.unlinkSync(tempPath)

    await page.setContent(htmlText)
    await page.setViewportSize({ width: 1200, height: 1600 })
    await page.emulateMedia({ media: 'print' })

    const pageContainer = page.locator('.page')
    const box = await pageContainer.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(Math.round(box.width)).toBe(794)
      expect(Math.round(box.height)).toBe(1123)
    }

    const transactionBox = page.locator('.transaction-box')
    const tbBox = await transactionBox.boundingBox()
    expect(tbBox).not.toBeNull()
    if (tbBox) {
      expect(tbBox.height).toBeGreaterThan(400)
    }

    const footer = page.locator('.footer')
    const footerBox = await footer.boundingBox()
    expect(footerBox).not.toBeNull()
    if (box && footerBox) {
      expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(box.y + box.height)
    }
  })
})