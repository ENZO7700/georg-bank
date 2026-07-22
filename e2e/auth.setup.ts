import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { gotoApp } from './helpers/app'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('authenticate', async ({ page }) => {
  const authDir = path.dirname(authFile)
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // Current app flow: site gate (if enabled) → guest auto-login → dashboard
  await gotoApp(page, '/dashboard')
  await page.waitForURL(/dashboard/, { timeout: 30000 })
  await expect(page.getByText('SPACE účet').first()).toBeVisible({ timeout: 20000 })

  await page.context().storageState({ path: authFile })
  console.log(`✅ Auth session saved to ${authFile}`)
})
