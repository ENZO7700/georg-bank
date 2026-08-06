# iPhone 14 Plus E2E

Hand-maintained (never overwritten by this script):

- `auth.spec.ts` — guest → PIN → Prehľad via `loginWithPin`
- `dashboard.spec.ts` — full-bleed Prehľad; classic Menu/Odhlás on `/dashboard/payment-orders`

200 skipped scaffold tests for the **iPhone 14 Plus** project in `playwright.config.ts`.

Device preset: Playwright `devices['iPhone 14 Plus']` (428×746 viewport, 3× DPR, WebKit).

Run only this suite:

```bash
npx playwright test --project="iPhone 14 Plus"
```

Regenerate scaffolds only (auth/dashboard are excluded):

```bash
npx tsx scripts/generate-iphone-14-plus-tests.ts
```

| File | Tests | Focus |
|------|------:|-------|
| auth.spec.ts | hand | Auth + PIN |
| dashboard.spec.ts | hand | Dashboard2 full-bleed |
| transactions.spec.ts | 80 | Transactions |
| export-pdf.spec.ts | 40 | Export PDF |
| gestures.spec.ts | 40 | Gestures |
| edge-cases.spec.ts | 40 | Edge cases |
