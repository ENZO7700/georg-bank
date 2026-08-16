# Internet  PWA ()

A production-ready banking PWA (Progressive Web App) built with Next.js 16, PostgreSQL, and Better Auth.

**GitHub (private repo):** https://github.com/NEXIFY-STUDIO/georg  
**Aktuálna vetva:** `feat/html-statements`

## Features

- **Secure Authentication**: Email/password authentication with Better Auth
- **Multiple Accounts**: Create and manage checking and savings accounts
- **Transactions**: Transfer money between accounts, deposit funds, and track transaction history
- **Responsive Design**: Mobile-first design that works on all devices
- **Offline Support**: Service worker enables offline access to cached data
- **PWA Installation**: Install as a native app on iOS and Android
- **Real-time Updates**: Server actions for instant balance updates
- **Push Notifications**: Ready for Firebase Cloud Messaging integration

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **Documents**: HTML bank statements (SLSP layout), ZIP via fflate
- **Legacy PDF**: pdfmake / pdf-lib (webhook only)
- **Icons**: Lucide React
- **UI Components**: shadcn/ui

## Ako to funguje teraz

Toto je demo internet banking PWA s prihlasenim, dashboardom, novou platbou a automaticky generovanym PDF potvrdenim po uspesnom odoslani platby.

### Live URL

Aktuálna Vercel produkcia:

```text
https://george-dev.vercel.app
```

Pred zobrazením aplikácie je jednoduchá brána (site gate). Heslo je v env premennej `SITE_GATE_PASSWORD` (default: `heslo`).

### Prihlasenie

Prihlasovanie je postavené na Better Auth. Povolený je len jeden používateľ (email z `SUPER_ADMIN_EMAIL` / secrets súboru).

1. Otvor `/sign-in` (po zadaní hesla site gate).
2. Email: hodnota z `SUPER_ADMIN_EMAIL` v `.env.local`
3. Heslo: hodnota z `SUPER_ADMIN_PASSWORD` v `.env.local`

V lokálnom dev režime môžeš nechať polia prázdne — formulár doplní `NEXT_PUBLIC_DEV_USER_EMAIL` a `NEXT_PUBLIC_DEV_USER_PASSWORD`.

Hesla, DB connection stringy a API kľúče **necommituj** do repozitára. Použi `.env.local` (lokál) a Vercel Environment Variables (produkcia).

### Ubuntu / nový server

```bash
git clone https://github.com/NEXIFY-STUDIO/georg.git
cd georg
git checkout feat/html-statements
npm install --legacy-peer-deps
# vytvor .env.local podľa developer.md (DATABASE_URL, BETTER_AUTH_*, ...)
npm run dev                        # port 3030
```

### Dashboard

Po prihlaseni sa pouzivatel dostane na `/dashboard`.

Dashboard:

- zobrazuje SPACE ucet,
- zobrazuje disponibilny zostatok,
- zobrazuje demo karty,
- ma menu s polozkou `Nova platba`,
- ma stale viditelne spodne tlacidlo `+ Peniaze`,
- automaticky vytvori testovaci SPACE ucet, ak prihlaseny pouzivatel este ziadny ucet nema.

Automaticke vytvorenie uctu je v:

```text
app/dashboard/page.tsx
```

### Registracia a prevody medzi pouzivatelmi

Normalny pouzivatel sa registruje cez Better Auth. Po registracii sa ulozi do databazovej tabulky `user` a prihlasovacie udaje/password hash ostavaju v auth tabulkach.

Ked sa zaregistruju dvaja pouzivatelia, mozu si posielat peniaze medzi sebou cez e-mail:

1. Odosielatel ide do `Nova platba`.
2. Do pola `IBAN alebo cislo uctu` zada e-mail prijemcu.
3. Appka najde prijemcu v databaze.
4. Ak prijemca este nema SPACE/checking ucet, server action mu ho automaticky vytvori.
5. Odosielatelovi sa suma odpise, prijemcovi sa suma pripise.
6. Do tabulky `transaction` sa ulozi odchadzajuca transakcia pre odosielatela aj prijata transakcia pre prijemcu.

Logika je v:

```text
app/actions/banking.ts
```

### Historia prevodov na dashboarde

Dashboard obsahuje kontajner `Prehlad prevodov`, ktory zobrazuje realne transakcie prihlaseneho pouzivatela z databazy.

Historia podporuje filtre:

- `Vsetko`
- `Prijate`
- `Odoslane`
- `Dobitie`

Kazda polozka ukazuje protistranu, poznamku, datum, sumu a zostatok po transakcii. Kliknutim na polozku sa otvori detail s ID transakcie, stavom, kategoriou a zostatkom pred/po prevode.

Pre nove transakcie sa do tabulky `transaction` ukladaju aj:

```text
balanceBefore
balanceAfter
```

Tieto hodnoty sa zapisujú pri:

- internom prevode medzi registrovanymi pouzivatelmi,
- externej platbe,
- dobití uctu cez spodne menu `+ Peniaze`.

### George asistent

Po prihlaseni je na dashboarde a v detaile uctu dostupne plavajuce okienko `Asistent`. Widget je dole vpravo a neprekryva spodne tlacidlo `+ Peniaze`.

Asistent pouziva server route:

```text
app/api/assistant/chat/route.ts
```

Route overuje Better Auth session. Neprihlaseny pouzivatel dostane `401 Unauthorized`.

Asistent ma pripraveny bezpecny kontext aktualneho pouzivatela:

- meno a e-mail,
- ucty a aktualne zostatky,
- posledne transakcie,
- prijate a odoslane platby.

Asistent zatial nesmie vykonat platbu ani menit zostatky. Vie iba citat data prihlaseneho pouzivatela a vysvetlit postup v demo internet bankingu.

Ak nie je nastavene `MISTRAL_API_KEY`, chatbot bezi v demo rezime. Spravy sa aj v demo rezime ukladaju do databazy a odpoved jasne povie, ze Mistral API este nie je nakonfigurovane.

Pripravene env pre Mistral/web search:

```text
MISTRAL_API_KEY
MISTRAL_MODEL
ASSISTANT_WEB_SEARCH_ENABLED
```

Default model je:

```text
mistral-small-latest
```

Internetove vyhladavanie je pripravene cez:

```text
lib/assistant/web-search.ts
```

Ak `ASSISTANT_WEB_SEARCH_ENABLED` nie je `true`, agent povie, ze web search este nie je zapnuty.

### Dashboard asistenta

Interny dashboard asistenta je na:

```text
/dashboard/assistant
```

Je dostupny cez menu `Asistent` a zobrazuje:

- stav `MISTRAL_API_KEY`,
- aktivny model,
- stav web search,
- pocet konverzacii,
- pocet sprav,
- poslednu chybu,
- testovaci input na odoslanie spravy.

Tabulky asistenta:

```text
assistant_conversation
assistant_message
assistant_run_log
```

### Pridanie penazi cez spodne menu

V spodnej casti dashboardu a detailu uctu je stale viditelne male tlacidlo:

```text
+ Peniaze
```

Tlacidlo otvori maly footer panel, kde sa da zadat suma s desatinnymi cislami. Input akceptuje bodku aj ciarku, napriklad:

```text
12.34
12,34
```

Panel obsahuje aj rychle volby:

```text
+0,10
+1,00
+10,00
+100,00
```

Po kliknuti na `Pridat na ucet` sa zavola server action:

```text
depositFunds()
```

Transakcia sa zapise ako `deposit` s popisom:

```text
Pridanie penazi | Dobitie cez spodne menu | Ostatne nepravidelne prijmy
```

Po uspesnom pridani penazi sa zavola `router.refresh()` a zostatok sa prepocita na dashboarde aj v detaile uctu.

Komponent je v:

```text
components/add-money-footer.tsx
```

Server action je v:

```text
app/actions/banking.ts
```

### Nova platba

Platba sa otvara cez menu:

```text
Menu -> Nova platba
```

Formular je v:

```text
components/transfer-form.tsx
```

Pouzivatel vypisuje tieto polia:

- `Prijemca`
- `IBAN alebo cislo uctu`
- `Suma`
- `Variabilny symbol`
- `Konstantny symbol`
- `Specificky symbol`
- `Poznamka pre prijemcu`
- `Referencia platitela`
- `Datum splatnosti`
- `Pocet dni opakovania`
- `Vytvorit sablonu`
- `E-mailove potvrdenie`

Po kliknuti na `Podpisat platbu` sa najprv zavola server action. PDF sa generuje az po uspesnej platbe.

### Typy platby

Pole `IBAN alebo cislo uctu` vie fungovat dvoma sposobmi.

Ak hodnota vyzera ako e-mail:

```text
recipient@example.com
```

appka pouzije interny prevod:

```text
internalTransferByEmail()
```

Interny prevod funguje vtedy, ked prijemca s tymto e-mailom existuje v databaze. Ak este nema aktivny SPACE/checking ucet, vytvori sa mu automaticky pri prvom prijati platby.

Ak hodnota nie je e-mail, appka vytvori externu platbu:

```text
createTransaction()
```

Server actions su v:

```text
app/actions/banking.ts
```

### Potvrdenie o platbe (HTML)

Po úspešnej platbe appka pripraví **HTML doklad** v dizajne Slovenskej sporiteľne a ponúkne stiahnutie v prehliadači.

Kľúčové súbory:

```text
lib/payment-confirmation-pdf.ts              # HTML engine
lib/payment-confirmation-from-transaction.ts # mapovanie DB → doklad
app/api/export/payment-confirmation/route.ts # GET API endpoint
```

Po každej novej platbe sa do `transaction.pdfUrl` uloží cesta:

```text
/api/export/payment-confirmation?transactionId=<uuid>
```

Doklad je dostupný z:

- úspešnej obrazovky platby (Zobraziť / Stiahnuť doklad),
- modalu transakcie na dashboarde,
- detailu účtu pri odchádzajúcich platbách,
- API endpointu (vyžaduje session).

Metadata platby sa ukladajú do `transaction.description` ako 8 polí oddelených `|`:

```text
meno|poznámka|kategória|iban|vs|ks|ss|referencia
```

### Generátor 3 mesačných výpisov

Menu → **Výpisy** alebo `/dashboard/statements/generator`

- Vygeneruje 3 mesačné HTML výpisy so simulovanými platbami (10–30/mesiac)
- Vlastný názov účtu (`displayName`), nastaviteľný obrat a mix platieb
- Preview režim (default) alebo persist do DB
- Stiahnutie jednotlivých mesiacov alebo ZIP (fflate)

API:

```text
POST /api/statements/generate-bulk
```

Kľúčové súbory: `lib/statement-generator.ts`, `components/statement-generator-client.tsx`

### Bezpecnost PDF

PDF je zamerne oznacene ako demo vystup:

```text
DEMO / TEST
```

Obsahuje aj upozornenie, ze nejde o oficialne bankove potvrdenie ani doklad o realnej bankovej platbe. Toto oznacenie neodstranuj, pokial projekt zostava demo/sandbox.

### Databaza na VPS

VPS verzia pouziva samostatny PostgreSQL kontajner:

```text
internet-bank-pwa-main-db
```

Appka bezi v:

```text
/var/www/internet-bank-pwa-main
```

Runtime proces spravuje pm2:

```bash
pm2 status internet-bank-pwa-main
pm2 logs internet-bank-pwa-main --lines 100
pm2 restart internet-bank-pwa-main --update-env
```

Database schema sa aplikuje cez Drizzle:

```bash
pnpm exec drizzle-kit push --schema=lib/db/schema.ts --dialect=postgresql --url="$DATABASE_URL"
```

### Env pre lokalny/VPS/Vercel beh

Minimalne potrebne env pre appku:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_DEV_USER_EMAIL
NEXT_PUBLIC_DEV_USER_PASSWORD
MISTRAL_API_KEY
MISTRAL_MODEL
ASSISTANT_WEB_SEARCH_ENABLED
```

Na Verceli sa env nastavuje cez Vercel env variables.

Na VPS je env subor:

```text
/var/www/internet-bank-pwa-main/.env.local
```

`BETTER_AUTH_URL` musi sediet na skutocnu verejnu URL aplikacie, inak Better Auth odmietne login cez `Invalid currentURL`.

Pre VPS je to:

```text
https://internet-bank-pwa-main.194.182.87.6.nip.io
```

### VPS deploy flow

Rychly deploy na VPS:

```bash
rsync -az components/transfer-form.tsx lib/payment-confirmation-pdf.ts package.json pnpm-lock.yaml fantastic4-vps:/var/www/internet-bank-pwa-main/ --relative
ssh fantastic4-vps 'cd /var/www/internet-bank-pwa-main && pnpm install --frozen-lockfile && pnpm build && pm2 restart internet-bank-pwa-main --update-env'
```

Ak menis iba jeden subor, staci preniesit iba ten subor a prebuildit/restartnut appku.

### Overenie loginu

Rychla kontrola cez prehliadac alebo Playwright:

1. Otvor live URL.
2. Klikni `Prihlasit sa`.
3. Po prihlaseni musi URL skoncit na `/dashboard`.
4. Na stranke musi byt vidno dashboard a `Odhlasenie`.

### Overenie PDF flow

Rucny test:

1. Prihlas sa.
2. Otvor `Menu -> Nova platba`.
3. Vypln vsetky polia.
4. Zadaj malu sumu, napriklad `0.01`.
5. Klikni `Podpisat platbu`.
6. Musi sa zobrazit uspesna obrazovka.
7. Musi sa stiahnut PDF.
8. V PDF musi byt watermark `DEMO / TEST`.

Automaticky test, ktory uz presiel:

```text
SUCCESS_SCREEN=true
DOWNLOAD=true
Pages: 1
DEMO / TEST=True
```

### Overenie pridania penazi

Automaticky test spodneho tlacidla `+ Peniaze`, ktory uz presiel:

```text
SUCCESS=true
BEFORE=0,83 EUR
AFTER=13,17 EUR
```

DB kontrola poslednej transakcie:

```text
12.34 | deposit | Pridanie penazi | Dobitie cez spodne menu | Ostatne nepravidelne prijmy
```

### Zname poznamky

- `npm run build` prechádza lokálne aj na Vercel.
- Primárny formát dokladov je **HTML** (tlač prehliadača = PDF), nie binárny PDF súbor.
- Kompletná architektúra: `docs/FINAL-BLUEPRINT.md`
- Backfill `pdfUrl` pre staré platby: `npm run db:backfill-pdf-url`
- Doklady sú demo výstupy, nie právne bankové potvrdenia.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Neon PostgreSQL database
- BETTER_AUTH_SECRET environment variable (generate with `openssl rand -base64 32`)

### Installation

1. **Clone and install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```
   DATABASE_URL=your_neon_database_url
   BETTER_AUTH_SECRET=your_auth_secret
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Open in browser**:
   Visit `http://localhost:3000`

## Project Structure

```
├── app/
│   ├── api/auth/[...all]/          # Better Auth endpoints
│   ├── dashboard/                   # Protected dashboard routes
│   │   └── accounts/[id]/           # Account detail page
│   ├── actions/                     # Server actions
│   ├── sign-in/                     # Sign in page
│   ├── sign-up/                     # Sign up page
│   └── layout.tsx                   # Root layout with PWA config
├── components/
│   ├── auth-form.tsx                # Sign in/up form
│   ├── dashboard-header.tsx         # Header with user menu
│   ├── account-card.tsx             # Account display card
│   ├── transactions-list.tsx        # Transaction list
│   ├── transfer-form.tsx            # Transfer/deposit form
│   └── new-account-button.tsx       # Create account button
├── lib/
│   ├── auth.ts                      # Better Auth config
│   ├── auth-client.ts               # Client auth utilities
│   └── db/
│       ├── index.ts                 # Drizzle client
│       └── schema.ts                # Database schema
└── public/
    ├── manifest.json                # PWA manifest
    ├── service-worker.js            # Service worker
    ├── offline.html                 # Offline fallback page
    └── icon-*.png                   # App icons
```

## Database Schema

### Better Auth Tables
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens

### App Tables
- `bank_account` - Bank accounts (checking, savings)
- `transaction` - Transaction history

## Key Features

### Authentication
- Email/password registration and login
- Session-based authentication
- Secure password hashing via Better Auth

### Banking Operations
- Create multiple accounts (checking/savings)
- View account balance
- Transfer money between accounts
- Deposit funds
- View transaction history
- Transaction status tracking

### PWA Features
- Service worker for offline support
- App manifest for installation
- Web app icons (multiple sizes)
- Offline fallback page
- Push notification ready

## Server Actions

All banking operations are implemented as server actions with proper user ID validation:

- `getBankAccounts()` - Get user's accounts
- `createBankAccount()` - Create new account
- `getTransactions()` - Get recent transactions
- `getAccountTransactions()` - Get account transactions including incoming and outgoing account movements
- `createTransaction()` - Transfer funds
- `depositFunds()` - Add funds to account
- `internalTransferByEmail()` - Transfer funds between registered users by recipient email

## Security Considerations

- All queries are scoped to the authenticated user via `getUserId()`
- Server actions verify session before executing
- Passwords are hashed with Better Auth
- CSRF protection via Better Auth
- No sensitive data exposed to client
- Transaction validation before processing

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`
     - `BETTER_AUTH_SECRET`

3. **Deploy**:
   - Vercel will automatically deploy on push

### PWA Installation

The app is automatically installable on:
- **Android**: Install via Chrome/Firefox browser prompt
- **iOS**: Use "Add to Home Screen" in Safari
- **Desktop**: Install via browser menu

## Future Enhancements

- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Bill pay functionality
- [ ] Mobile app detection and deeplinks
- [ ] Transaction search and filtering
- [ ] Export transaction history
- [ ] Budget tracking
- [ ] Account analytics
- [ ] 2FA/MFA security
- [ ] Transaction categories
- [ ] Recurring transfers

## API Endpoints & Envs

Pre detailnú vývojársku a architektonickú dokumentáciu, zoznam všetkých API a konfiguráciu prostredia si pozrite samostatný súbor [developer.md](file:///Users/erikbabcan/Downloads/internet-bank-pwa-main/developer.md).

### Zoznam API Endpointov
- **Site Gate**: `POST /api/gate`
- **Autentifikácia**: `/api/auth/[...all]` (Better Auth)
- **Potvrdenie platby**: `GET /api/export/payment-confirmation?transactionId=`
- **Mesačný výpis z DB**: `GET /api/export/pdf?accountId=`
- **Generátor výpisov**: `POST /api/statements/generate-bulk`
- **George Asistent**: `POST /api/assistant/chat`
- **Webhook platby**: `POST /api/webhooks/process-payment` (Mistral, pdf-lib, Blob, push)
- **Offline sync**: `POST /api/sync`
- **Push subscribe**: `POST /api/webhooks/push/subscribe`

### Hlavné Environment Premenné
- `DATABASE_URL` - Connection string do PostgreSQL
- `BETTER_AUTH_SECRET` - Tajný kľúč pre Better Auth relácie
- `BETTER_AUTH_URL` - Hlavná adresa aplikácie (napr. `http://localhost:3030`)
- `MISTRAL_API_KEY` - API kľúč pre Mistral AI
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` - Kľúče pre Web Push notifikácie
- `BLOB_READ_WRITE_TOKEN` - (Voliteľné) Vercel Blob token na ukladanie PDF

## Development

### Super Admin a Príkazy

Ak chcete nastaviť prístup pre Super Admina (lokálne aj na Verceli), postupujte takto:

1. Otvorte súbor `.env` a vyplňte svoje reálne údaje pre `SUPER_ADMIN_EMAIL` a `SUPER_ADMIN_PASSWORD`.
2. Spustite skript (vyžaduje prihlásenie do Vercel CLI, ak to chcete nastaviť aj na Verceli):
   ```bash
   ./setup-super-admin.sh
   ```

### Spustenie prostredia (Dev, Build, Deploy)

#### 1. Lokálny vývoj (Run Dev)
```bash
npm run dev
# alebo ak používate pnpm
pnpm dev
```

#### 2. Vytvorenie produkčného buildu (Build)
```bash
npm run build
# alebo
pnpm build
```

#### 3. Nasadenie na Vercel (Deploy)
Ak používate Vercel CLI, nasadenie spustíte príkazom:
```bash
# Pre deploy do produkcie (Production):
vercel --prod

# Pre testovací deploy (Preview):
vercel
```

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Linting
```bash
pnpm lint
```

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure app is served over HTTPS (except localhost)
- Clear service worker cache: DevTools > Application > Service Workers > Unregister

### Session Not Persisting
- Verify `BETTER_AUTH_SECRET` is set
- Check browser cookies are enabled
- Clear browser cache and cookies

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure Neon project allows connections
- Check network connectivity

## Support

For issues or questions, open an issue on GitHub or contact support.

## License

MIT
