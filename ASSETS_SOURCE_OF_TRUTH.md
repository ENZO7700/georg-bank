# ASSETS SOURCE OF TRUTH

Toto je centrálny dokument, ktorý definuje absolútne a nemenné cesty k základným grafickým prvkom (assets) v tomto projekte. 

Tieto cesty sú fixné a nesmú sa už **nikdy** meniť v zdrojovom kóde.

## Logá
- **Logo v modrej hlavičke / patičke / inverzné:** `/assets/slvnsk.png`
  - *Súbor sa fyzicky nachádza v `public/assets/slvnsk.png`.*
  - *Používa sa v:*
    - hlavičke dashboardu (`dashboard-header.tsx`)
    - hlavičke platobných príkazov (`payment-orders-client.tsx`)
    - patičke prihlasovacieho formulára (`auth-form.tsx`) (tá, ktorá má `class="h-6 w-auto object-contain"`)
    - PDF šablóne (`pdf-statement-template.tsx`)
    - globálnom CSS pre `.logo` triedu.
  - Toto logo sa nesmie meniť.

- **Farebné / Štandardné logo:** `/assets/logo-slovenska-sporitelna.png`
  - *Súbor sa fyzicky nachádza v `public/assets/logo-slovenska-sporitelna.png`.*
  - *Používa sa v:*
    - prihlasovacom formulári (`auth-form.tsx`) **ako hlavné logo nad nadpisom "Prihlásenie"** (`class="w-[90px] h-auto mb-2 ml-auto mr-auto object-contain"`).
  - Toto logo sa nesmie nahrádzať tým prvým.

## Prístupová brána (Site Gate)
* **Status loga:** Logo bolo kompletne **odstránené** zo vstupnej brány (`site-gate-form.tsx`) pre dosiahnutie čistého a minimalistického vzhľadu na žiadosť používateľa.
* **Aktuálne prihlasovacie heslo do brány:** `"23513900"` (nakonfigurované v `.env.local` ako `SITE_GATE_PASSWORD`).
* **Jediný aktívny Git repozitár:** `https://github.com/ENZO7700/landing-page-g.git`
* **Produkčná URL adresa:** `https://portal-auth-8f2c3d.vercel.app` (spravovaná pod Vercel projektom `portal-auth-8f2c3d` v scope `viandmos-projects`).

