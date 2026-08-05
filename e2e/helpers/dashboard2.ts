import { expect, type Page } from '@playwright/test'
import { gotoApp } from './app'

type Dashboard2Options = {
  /** Absolute origin (e.g. https://george-….vercel.app) or omit for baseURL. */
  origin?: string
}

/**
 * Open dashboard2. App lands on the PIN/George kľúč screen first
 * (isPasscodeScreen defaults to true). Site gate + guest handled by gotoApp.
 */
export async function openDashboard2Welcome(page: Page, options?: Dashboard2Options) {
  const path = options?.origin ? `${options.origin.replace(/\/$/, '')}/dashboard2` : '/dashboard2'
  await gotoApp(page, path)
  await expect(page.getByText(/Zadajte bezpečnostný PIN/i)).toBeVisible({
    timeout: 20000,
  })
}

export async function openPinScreen(page: Page, options?: Dashboard2Options) {
  await openDashboard2Welcome(page, options)
  await expect(page.getByRole('button', { name: '1', exact: true })).toBeVisible({ timeout: 10000 })
  // Face ID overlay must NOT auto-open
  await expect(page.locator('.face-id-backdrop')).toHaveCount(0)
}

export async function enterPin(page: Page, pin: string) {
  for (const digit of pin) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
}

/** PIN login into Prehľad (no welcome CTA click — PIN is the entry screen). */
export async function loginWithPin(page: Page, pin = '666666', options?: Dashboard2Options) {
  await openPinScreen(page, options)
  await enterPin(page, pin)
  await expect(page.getByRole('heading', { name: 'Prehľad', exact: true })).toBeVisible({
    timeout: 15000,
  })
}

/**
 * Mock face-api CDN (+ optional fake webcam).
 * Call before navigation or before Face ID click.
 */
export async function installFaceIdMocks(
  page: Page,
  options?: { detectFace?: boolean; camera?: 'fake' | 'deny' | 'none' }
) {
  const detectFace = options?.detectFace !== false
  const camera = options?.camera ?? 'fake'

  if (camera === 'fake') {
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) return
      navigator.mediaDevices.getUserMedia = async (constraints?: MediaStreamConstraints) => {
        if (constraints && 'video' in constraints && constraints.video) {
          const canvas = document.createElement('canvas')
          canvas.width = 320
          canvas.height = 320
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#222'
            ctx.fillRect(0, 0, 320, 320)
            ctx.fillStyle = '#f5c6a5'
            ctx.beginPath()
            ctx.arc(160, 160, 70, 0, Math.PI * 2)
            ctx.fill()
          }
          if (typeof canvas.captureStream === 'function') {
            return canvas.captureStream(15)
          }
        }
        throw new Error('getUserMedia not available')
      }
    })
  } else if (camera === 'deny') {
    await page.addInitScript(() => {
      if (!navigator.mediaDevices) return
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError')
      }
    })
  }

  // Intercept face-api script and serve a minimal mock
  await page.route('**/face-api@*/dist/face-api.js', async (route) => {
    const body = `
(function (global) {
  var detect = ${detectFace ? 'true' : 'false'};
  var net = {
    isLoaded: false,
    loadFromUri: function () {
      net.isLoaded = true;
      return Promise.resolve();
    }
  };
  global.faceapi = {
    tf: {
      setBackend: function () { return Promise.resolve(); },
      ready: function () { return Promise.resolve(); }
    },
    nets: { tinyFaceDetector: net },
    TinyFaceDetectorOptions: function TinyFaceDetectorOptions() {},
    detectSingleFace: function () {
      return Promise.resolve(detect ? { score: 0.95, box: { x: 0, y: 0, width: 100, height: 100 } } : undefined);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
`
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body,
    })
  })
}
