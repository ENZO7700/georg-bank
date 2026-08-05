# iPhone 14 Plus E2E

Playwright project **iPhone 14 Plus** (`devices['iPhone 14 Plus']` – 428×746, 3× DPR, WebKit).

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
# whole 14 Plus project (live + skipped)
npm run test:iphone-14-plus

# only implemented suites
npx playwright test --project="iPhone 14 Plus" e2e/iphone-14-plus/auth.spec.ts e2e/iphone-14-plus/dashboard.spec.ts

# modern default (17 Pro + Air) — does NOT include 14 Plus
npm run test:iphone
```

Legacy only: this folder is excluded from `npm run test:iphone`. Prefer shared suite in [`../iphone/`](../iphone/).

## Regenerate remaining scaffolds

```bash
npm run test:generate-iphone-14-plus
```

> Regenerating overwrites `auth.spec.ts` / `dashboard.spec.ts` – re-apply real tests after regenerate if needed.
