# SLSP výpis z účtu — mapovanie šablóny `slsp_35db`

Referenčný PDF: [`templates/slsp_35db-reference.pdf`](./templates/slsp_35db-reference.pdf)

HTML generátor: `lib/generate-transactions-pdf.ts`

## Layout (zhora nadol)

| Zóna | Obsah | Typ |
|------|--------|-----|
| Meta | `č.{N}/{YYYY} - Strana {page}/{total}` | dynamické |
| Header | Bankové údaje SLSP (vľavo) + adresa klienta (vpravo) | statický + dynamický |
| Titulok | `Výpis z Účtu: {accountProductType}` | dynamický |
| Details box | 2 stĺpce s modrými markermi | dynamický |
| Súhrn dane | `Transakčná daň spolu:` | dynamický |
| Tabuľka | 5 stĺpcov transakcií | dynamický |
| Rozpis dane | Prehľad zúčtovanej Transakčnej dane | dynamický (voliteľné) |
| Právny text | Ochrana vkladov | statický |
| Footer | info@slsp.sk · 0850 111 888 · www.slsp.sk | statický |

## Mapovanie polí

| Pole v PDF | Placeholder / property | Zdroj dát |
|------------|------------------------|-----------|
| Názov Účtu | `accountName` | `bankAccount.displayName` |
| Číslo Účtu | `accountNumber` (formát IBAN) | `bankAccount.accountNumber` |
| BIC | z IBAN (`GIBASKBX` pre 0900) | `getBicFromIban()` |
| Mena | `currency` | `bankAccount.currency` |
| Dátum vyhotovenia výpisu | `statementDate` | koniec obdobia / dnes |
| Účtovné obdobie | `accountingPeriod` | `01. MM. YYYY - DD. MM. YYYY` |
| Počiatočný stav Účtu | `initialBalance` | centy → `formatBalance()` |
| Vklady spolu | `depositsTotal` | centy |
| Výbery spolu | `withdrawalsTotal` | centy (so znamienkom `-`) |
| Konečný stav Účtu | `finalBalance` | centy |
| Typ produktu | `accountProductType` | default `Business účet S` |
| Adresa klienta | `holderAddressLines[]` | voliteľné riadky pod menom |
| č.N/YYYY | `statementNumber` | mesiac výpisu, napr. `3/2026` |
| Transakčná daň spolu | `transactionTaxTotalCents` | voliteľné, default 0 |
| Riadok dane | `transactionTaxLines[]` | `{ label, amountCents, count }` |

## Stĺpce tabuľky transakcií

| Stĺpec | Property riadku |
|--------|-----------------|
| Dátum valuty | `TransactionRow.date` |
| Dátum zúčtovania | `TransactionRow.date` (rovnaký) |
| Popis transakcie | názov typu + subtext z `description` |
| Suma transakcie | `amount` (+/- podľa typu) |
| Suma poplatku | `0,00` (default) |

**Odstránené oproti starej šablóne:** stĺpec „Zostatok po transakcii“, sekcia „Informácia pre klienta“ s hardcoded textom o prečerpaní, vertikálny kód `MO10_v203_…`.

## Statické texty (nemazať — sú súčasť brandu)

- Slovenská sporiteľňa, a.s. · Tomášikova 48 · IČO · ORSR
- Vklad podliehajúci ochrane vkladov…
- Footer kontakty
- Hlavičky stĺpcov a labels v details boxe

## Formátovanie

- Suma: `40 350,00` (medzera tisíc, desatinná čiarka)
- Dátum: `31. 03. 2026` (medzery okolo mesiaca)
- Obdobie: `01. 03. 2026 - 31. 03. 2026`
- Stránkovanie: 12 riadkov na str. 1, 18 na pokračovaní
