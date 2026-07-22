# iPhone 17 Air E2E

Playwright project **iPhone 17 Air** (`devices['iPhone Air']` – 420×719, 3× DPR, WebKit).

## Implemented (real tests)

| File | Status | Focus |
|------|--------|-------|
| `auth.spec.ts` | **live** | gate, form layout, validation, login, protected routes |
| `dashboard.spec.ts` | **live** | header, products, cards, menu, overflow, cross-page header |
| `transactions.spec.ts` | scaffold (skip) | transactions |
| `export-pdf.spec.ts` | scaffold (skip) | PDF export |
| `gestures.spec.ts` | scaffold (skip) | touch / gestures |
| `edge-cases.spec.ts` | scaffold (skip) | offline, rotate, deep links |

## Run

```bash
# whole 17 Air project (live + skipped)
npm run test:iphone-17-air

# only implemented suites
npx playwright test --project="iPhone 17 Air" e2e/iphone-17-air/auth.spec.ts e2e/iphone-17-air/dashboard.spec.ts

# both iPhone devices
npm run test:iphone
```

## Regenerate remaining scaffolds

```bash
npm run test:generate-iphone-17-air
```

> Regenerating overwrites `auth.spec.ts` / `dashboard.spec.ts` – re-apply real tests after regenerate if needed.
