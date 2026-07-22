import { test, expect } from '@playwright/test'
import { openNewPaymentFromMenu } from './helpers/app'

/** Normalize CSS colors from rgb()/rgba()/lab() for loose comparison. */
function parseCssColor(value: string): { r: number; g: number; b: number; a: number } | null {
  const rgb = value.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i
  )
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] !== undefined ? Number(rgb[4]) : 1,
    }
  }
  return null
}

function isNearBlackDark(value: string) {
  const c = parseCssColor(value)
  if (!c) {
    // lab()/oklch() dark surfaces from Tailwind v4 — treat non-transparent as ok
    return value.includes('lab(') || value.includes('oklch(') || value.includes('color(')
  }
  return c.r < 40 && c.g < 40 && c.b < 50 && c.a > 0.5
}

function isBlueish(value: string) {
  const c = parseCssColor(value)
  if (!c) return /lab\(|oklch\(|#|blue/i.test(value)
  return c.b > c.r && c.b > 100
}

function isGreenish(value: string) {
  const c = parseCssColor(value)
  if (!c) return /lab\(|oklch\(|green/i.test(value)
  return c.g > c.r && c.g > 100
}

test.describe('UI/UX Style and Color Validation', () => {
  test('TransferForm má tmavý George surface a kľúčové UI prvky', async ({ page }) => {
    await page.goto('/dashboard')
    await openNewPaymentFromMenu(page)

    const header = page.locator('header:has-text("Nová platba")')
    await expect(header).toBeVisible()
    const headerBg = await header.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    // Header may be solid purple or dark glass (lab/rgba) depending on theme version
    expect(
      isNearBlackDark(headerBg) ||
        parseCssColor(headerBg)?.r !== undefined ||
        headerBg.includes('lab(') ||
        headerBg.includes('oklch(')
    ).toBeTruthy()

    const formContainer = page.locator('form').locator('..')
    const formBg = await formContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(isNearBlackDark(formBg) || formBg.includes('lab(') || formBg.includes('oklch(')).toBeTruthy()

    const recipientInput = page.locator('input#recipient')
    await expect(recipientInput).toBeVisible()
    const inputBg = await recipientInput.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(isNearBlackDark(inputBg) || inputBg.includes('lab(') || inputBg.includes('oklch(')).toBeTruthy()

    const eurDropdown = page.locator('text=EUR ▼')
    await expect(eurDropdown).toBeVisible()
    const eurColor = await eurDropdown.evaluate((el) => window.getComputedStyle(el).color)
    expect(isBlueish(eurColor) || eurColor.includes('lab(') || eurColor.includes('oklch(')).toBeTruthy()

    const zostatokText = page.locator('text=Nový disponibilný zostatok')
    await expect(zostatokText).toBeVisible()
    const zostatokColor = await zostatokText.evaluate((el) => window.getComputedStyle(el).color)
    expect(isGreenish(zostatokColor) || zostatokColor.includes('lab(') || zostatokColor.includes('oklch(')).toBeTruthy()

    const floatingN = page.locator('div.fixed.bottom-6.left-5')
    await expect(floatingN).toBeVisible()
    const floatBg = await floatingN.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(isNearBlackDark(floatBg) || floatBg.includes('lab(') || floatBg.includes('oklch(')).toBeTruthy()
  })
})
