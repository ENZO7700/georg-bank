import { test, expect } from '@playwright/test'
import {
  expectGeorgeHeader,
  openNewPaymentFromMenu,
} from './helpers/app'

test.describe('PDF / HTML export – aktuálny flow', () => {
  test('Dashboard2 a payment-orders majú zjednotený header', async ({ page }) => {
    await page.goto('/dashboard2')
    await expectGeorgeHeader(page)

    await page.goto('/dashboard2/payment-orders')
    await expect(page).toHaveURL(/payment-orders/)
    await expectGeorgeHeader(page)
  })

  test('Menu → Nová platba otvorí transfer formulár', async ({ page }) => {
    await page.goto('/dashboard2')
    await openNewPaymentFromMenu(page)
    await expect(page.locator('input#recipient')).toBeVisible()
    await expect(page.locator('input#iban')).toBeVisible()
    await expect(page.locator('input#amount')).toBeVisible()
  })

  test('Transfer formulár má tlačidlo Podpísať platbu', async ({ page }) => {
    await page.goto('/dashboard2')
    await openNewPaymentFromMenu(page)
    await expect(page.getByRole('button', { name: /Podpísať platbu/i })).toBeVisible()
  })
})