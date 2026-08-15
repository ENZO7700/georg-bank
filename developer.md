# George Internetbanking PWA — Vývojárska dokumentácia

> Aktualizované: 30. 6. 2026 · vetva `feat/html-statements`  
> Kompletný blueprint: [`docs/FINAL-BLUEPRINT.md`](docs/FINAL-BLUEPRINT.md)

---

## Vývojárske prostredie

| Nastavenie | Hodnota |
|---|---|
| **Shell** | `zsh` |
| **Node** | 18+ (odporúčané v24) |
| **Port (dev)** | `3030` (`npm run dev`) |
| **Package manager** | npm / pnpm |
| **Playwright BASE_URL** | `http://localhost:3030` (lokál) / `https://georg-bank-viandmos-projects.vercel.app` (produkcia) |
| **GitHub** | https://github.com/NEXIFY-STUDIO/georg (private) |

---

## Architektúra

Next.js 16 App Router + Server Actions + Better Auth + Drizzle ORM + PostgreSQL + PWA.

```
[ Browser / PWA ]
   │
   ├─► proxy.ts (Site Gate – Next.js 16 proxy, formerly middleware)
   ├─► Server Actions (banking.ts, statements.ts) ──► PostgreSQL
   ├─► GET /api/export/payment-confirmation  ──► HTML doklad (1 platba)
   ├─► GET /api/export/pdf                   ──► HTML výpis (mesačný, z DB)
   ├─► POST /api/statements/generate-bulk      ──► 3 simulované výpisy
   ├─► POST /api/webhooks/process-payment    ──► Mistral + pdf-lib + Blob + push
   └─► POST /api/assistant/chat              ──► George AI
```

**Dôležité:** Primárny formát dokladov je **HTML** (SLSP layout), nie pdfmake. PDF = tlač prehliadača alebo voliteľný webhook output.

---

## Environment Variables

| Premenná | Popis | Povinná |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | **Áno** |
| `BETTER_AUTH_SECRET` | Session šifrovanie | **Áno** |
| `BETTER_AUTH_URL` | Kanonická URL (`https://georg-bank-viandmos-projects.vercel.app`) | **Áno** |
| `SITE_GATE_PASSWORD` | Heslo pred appkou | **Áno** (prod) |
| `SITE_GATE_ENABLED` | `false` pre CI/testy | Nie |
| `MISTRAL_API_KEY` | AI asistent + webhook | Odporúčané |
| `MISTRAL_MODEL` | Default `mistral-small-latest` | Nie |
| `ASSISTANT_WEB_SEARCH_ENABLED` | `true`/`false` | Nie |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push | Push |
| `VAPID_PRIVATE_KEY` | Web Push | Push |
| `VAPID_SUBJECT` | `mailto:...` | Push |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (webhook PDF) | Nie |
| `NEXT_PUBLIC_DEV_USER_EMAIL` | Dev quick login | Nie |
| `NEXT_PUBLIC_DEV_USER_PASSWORD` | Dev quick login | Nie |
| `SUPER_ADMIN_EMAIL` / `PASSWORD` | Seed | Nie |

---

## API Reference

### Site Gate
- `POST /api/gate` — overí heslo, nastaví cookie `site_gate`

### Autentifikácia
- `GET/POST /api/auth/[...all]` — Better Auth (sign-in, sign-out, session)

### Dokumenty

#### Potvrdenie o platbe
```
GET /api/export/payment-confirmation?transactionId=<uuid>
```
- Vyžaduje Better Auth session
- Typy: `withdrawal`, `transfer`
- Response: `text/html; charset=utf-8`

#### Mesačný výpis z DB
```
GET /api/export/pdf?accountId=<uuid>&month=YYYY-MM
```

#### Generátor 3 výpisov
```
POST /api/statements/generate-bulk
```
```json
{
  "accountId": "uuid",
  "displayName": "SPACE účet",
  "transactionsPerMonth": 20,
  "averageMonthlyTurnoverEur": 3000,
  "mix": { "outgoing": 70, "incoming": 20, "topup": 10 },
  "persistToDatabase": false
}
```
Rate limit: 5 generovaní/hod/user (in-memory).

### Asistent
- `POST /api/assistant/chat` — Mistral chat, kontext z účtov a transakcií

### Webhooky
- `POST /api/webhooks/process-payment` — volá sa po `createTransaction` aj `internalTransferByEmail`
- `POST /api/webhooks/push/subscribe` — registrácia push subscription

### Sync
- `POST /api/sync` — offline fronta z IndexedDB

---

## Server Actions

### `app/actions/banking.ts`

| Action | Popis |
|--------|-------|
| `getBankAccounts()` | Účty používateľa |
| `createBankAccount(type, currency)` | Nový účet |
| `getTransactions(limit)` | Posledné transakcie |
| `getAccountTransactions(accountId, limit)` | Transakcie účtu |
| `createTransaction(...)` | Externá platba (IBAN) + webhook + pdfUrl |
| `internalTransferByEmail(...)` | Prev od user→user + webhook + pdfUrl |
| `depositFunds(...)` | Dobitie (+ Peniaze) |

### `app/actions/statements.ts`

| Action | Popis |
|--------|-------|
| `generateBulkStatementsAction(config)` | 3 simulované mesačné výpisy |

---

## Dokumentový engine

### Potvrdenie o platbe
- `lib/payment-confirmation-pdf.ts` — `generatePaymentConfirmationHtml()`
- `lib/payment-confirmation-from-transaction.ts` — `encodeTransactionDescription()`, `buildPaymentConfirmationFromTransaction()`
- `lib/banking-pdf-url.ts` — `attachPaymentConfirmationUrl()`

### Mesačný výpis
- `lib/generate-transactions-pdf.ts` — `generateTransactionsPdf()`
- `lib/statement-generator.ts` — simulácia N platieb / 3 mesiace

### Formát description (8 polí)
```
meno|poznámka|kategória|iban|vs|ks|ss|referencia
```

---

## Databáza

```bash
npm run db:migrate          # aplikuj migrácie
npm run db:seed             # seed používateľov
npm run db:backfill-pdf-url # doplní pdfUrl pre staré withdrawals
npm run db:studio           # Drizzle Studio
```

Migrácie:
- `drizzle/0000_smart_gamma_corps.sql` — počiatočná schéma
- `drizzle/0001_account_display_name.sql` — `bank_account.displayName`

---

## Testovanie

```bash
npm run test:unit                                              # statement-generator unit
npm run build
npx playwright test --config=playwright.local.config.ts          # lokál E2E
BASE_URL=https://vykupujemstareplattne.vercel.app npx playwright test --config=playwright.prod.config.ts
npx playwright test e2e/payment-pdf-content.spec.ts            # platba + API doklad
npx playwright test e2e/statement-generator.spec.ts          # generátor
```

---

## Deploy

### Vercel (primárny)
```bash
npx vercel --prod --yes
```

Produkcia: https://vykupujemstareplattne.vercel.app

### VPS (legacy)
```bash
pm2 restart internet-bank-pwa-main --update-env
```

---

## Rýchly štart

```bash
git clone https://github.com/NEXIFY-STUDIO/georg.git
cd georg && git checkout feat/html-statements
npm install --legacy-peer-deps
# vytvor .env.local
npm run db:migrate
npm run dev   # http://localhost:3030
```

Prihlásenie (demo): `anton-karton-007@proton.me` / `admin@admin.com`  
Site gate: `heslo` (env `SITE_GATE_PASSWORD`)