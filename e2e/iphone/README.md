# Shared iPhone E2E

Device-agnostic mobile suite run by Playwright projects (`testMatch: /iphone\/.*\.spec\.ts/`):

| Project | Preset | Viewport | npm script |
|---------|--------|----------|------------|
| **iPhone 15** | `devices['iPhone 15']` | 393×659, 3× DPR | `test:iphone-15` |
| **iPhone 15 Pro** | `devices['iPhone 15 Pro']` | 393×659, 3× DPR | `test:iphone-15-pro` |
| **iPhone 17** | `devices['iPhone 17']` | 402×681, 3× DPR | `test:iphone-17` |
| **iPhone 17 Pro** | `devices['iPhone 17 Pro']` | 402×681, 3× DPR | `test:iphone-17-pro` |
| **iPhone Air** | `devices['iPhone Air']` (17 Air family) | 420×719, 3× DPR | `test:iphone-17-air` |

Legacy **iPhone 14 Plus** lives in `e2e/iphone-14-plus/` and is excluded from `npm run test:iphone`.

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
# all modern devices: 15, 15 Pro, 17, 17 Pro, Air
npm run test:iphone
# alias:
npm run test:iphone-all-modern

# single project
npm run test:iphone-15
npm run test:iphone-15-pro
npm run test:iphone-17
npm run test:iphone-17-pro
npm run test:iphone-17-air

# only implemented suites on 17 Pro
npx playwright test --project="iPhone 17 Pro" e2e/iphone/auth.spec.ts e2e/iphone/dashboard.spec.ts
```

## Regenerate remaining scaffolds

```bash
npm run test:generate-iphone
```

> Regenerating overwrites `auth.spec.ts` / `dashboard.spec.ts` – re-apply real tests after regenerate if needed.
