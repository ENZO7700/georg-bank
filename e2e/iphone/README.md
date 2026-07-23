# Shared iPhone E2E

Device-agnostic mobile suite run by Playwright projects:

| Project | Preset | Viewport |
|---------|--------|----------|
| **iPhone 17 Pro** (primary) | `devices['iPhone 17 Pro']` | 402×681, 3× DPR, WebKit |
| **iPhone Air** (second form factor) | `devices['iPhone Air']` | 420×719, 3× DPR, WebKit |

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
# default modern devices: 17 Pro + Air
npm run test:iphone

# single project
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
