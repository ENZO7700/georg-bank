import { expect, type Locator, type Page } from '@playwright/test'

/** Min. Apple HIG touch target size (logical px). */
export const MIN_TAP_TARGET = 44

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })
  expect(
    overflow.scrollWidth,
    `Horizontal overflow: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`
  ).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

export async function expectViewportMeta(page: Page) {
  const viewport = page.locator('meta[name="viewport"]')
  await expect(viewport).toHaveCount(1)
  const content = await viewport.getAttribute('content')
  expect(content).toMatch(/width=device-width/i)
}

export async function expectElementFitsViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  const vp = page.viewportSize()
  expect(box).toBeTruthy()
  expect(vp).toBeTruthy()
  if (box && vp) {
    expect(box.width).toBeLessThanOrEqual(vp.width + 1)
    expect(box.x).toBeGreaterThanOrEqual(-1)
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 2)
  }
}

export async function expectTapTargetMinSize(locator: Locator, min = MIN_TAP_TARGET) {
  await expect(locator).toBeVisible()
  const box = await locator.boundingBox()
  expect(box).toBeTruthy()
  if (box) {
    // Hit area should be reasonably tappable on a phone.
    expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(min - 4)
  }
}

export async function expectPortraitViewport(page: Page, minWidth: number, maxWidth: number) {
  const vp = page.viewportSize()
  expect(vp).toBeTruthy()
  if (vp) {
    expect(vp.width).toBeGreaterThanOrEqual(minWidth)
    expect(vp.width).toBeLessThanOrEqual(maxWidth)
    expect(vp.height).toBeGreaterThan(vp.width)
  }
}
