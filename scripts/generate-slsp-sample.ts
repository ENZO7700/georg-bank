/**
 * Generates docs/samples/slsp-sample.html from slsp_35db-reference.pdf fixture data.
 * Run: npx tsx scripts/generate-slsp-sample.ts
 */
import fs from 'fs'
import path from 'path'
import { generateTransactionsPdf } from '../lib/generate-transactions-pdf'

async function main() {
  const balanceCents = 4_035_000 // 40 350,00 EUR

  const html = await generateTransactionsPdf({
    accountName: 'DALMAN group s. r. o.',
    accountNumber: 'SK04 0900 0000 0052 0896 0265',
    currency: 'EUR',
    accountProductType: 'Business účet S',
    holderAddressLines: [
      'DALMAN group s. r. o.',
      'Trebišov Hodvábna 4269/13',
      '071 01 Michalovce 1',
    ],
    statementDate: '31. 03. 2026',
    accountingPeriod: '01. 03. 2026 - 31. 03. 2026',
    statementNumber: '3/2026',
    initialBalance: balanceCents,
    finalBalance: balanceCents,
    depositsTotal: balanceCents,
    withdrawalsTotal: balanceCents,
    transactionTaxTotalCents: 8009,
    transactionTaxLines: [
      { label: 'Transakčná daň', amountCents: 8003, count: 2 },
      { label: 'Transakčná daň (z poplatkov, úrokov)', amountCents: 3, count: 1 },
    ],
    transactions: [
      {
        id: 'sample-txn-1',
        date: '15. 03. 2026',
        type: 'withdrawal',
        description: 'Tesco Stores SR|Platba 10 000,00 EUR|Potraviny|SK67 0900 0000 0050 1111 2222|||',
        amount: 1_000_000,
        balanceAfter: 3_035_000,
        feeCents: 15,
      },
      {
        id: 'sample-txn-2',
        date: '22. 03. 2026',
        type: 'withdrawal',
        description: 'Daňový úrad SR|Platba 30 350,00 EUR|Dane|SK67 0900 0000 0050 3333 4444|||',
        amount: 3_035_000,
        balanceAfter: 0,
      },
      {
        id: 'sample-txn-3',
        date: '28. 03. 2026',
        type: 'deposit',
        description: 'Klient Alpha s.r.o.|Prijatá platba|Príjmy|SK67 1100 0000 0050 5555 6666|||',
        amount: balanceCents,
        balanceAfter: balanceCents,
      },
    ],
  })

  const outDir = path.join(process.cwd(), 'docs', 'samples')
  const outPath = path.join(outDir, 'slsp-sample.html')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outPath, html, 'utf8')

  console.log(`Sample statement written to ${outPath}`)
  console.log(`Open: file://${outPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
