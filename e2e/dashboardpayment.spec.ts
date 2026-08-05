import { test, expect } from '@playwright/test'
import { expectGeorgeHeader } from './helpers/app'

test.describe('Dashboard Payment overview', () => {
  test('stránka /dashboard2 je dostupná so zjednoteným headerom', async ({ page }) => {
    await page.goto('/dashboard2')
    await expect(page).toHaveURL(/dashboard2/)
    await expectGeorgeHeader(page)
    await expect(page.getByText(/Platby –/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/transakcií/)).toBeVisible()
  })

  test('export tlačidlo volá API s month parametrom', async ({ page }) => {
    await page.goto('/dashboard2')
    await page.waitForLoadState('networkidle')

    const exportBtn = page.getByRole('button', { name: /Exportovať výpis za/i })
    const hasTransactions = await exportBtn.isVisible().catch(() => false)

    if (!hasTransactions) {
      await expect(page.getByText(/Žiadne transakcie/)).toBeVisible()
      return
    }

    const apiRequest = page.waitForRequest((req) =>
      req.url().includes('/api/export/pdf') && req.url().includes('month=2026-04')
    )

    await exportBtn.click()
    const request = await apiRequest
    expect(request.url()).toContain('accountId=')
    expect(request.url()).toContain('month=2026-04')
  })
})