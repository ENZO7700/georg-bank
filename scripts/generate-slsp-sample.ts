/**
 * Generates docs/samples/slsp-sample.html — empty SLSP template matching slsp_35db-reference.pdf.
 * Optional payment preview: npx tsx scripts/generate-slsp-sample.ts --with-payment
 */
import fs from 'fs'
import path from 'path'
import { generateTransactionsPdf } from '../lib/generate-transactions-pdf'
import { encodeTransactionDescription } from '../lib/payment-confirmation-from-transaction'

const BASE_INPUT = {
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
  initialBalance: 4_035_000,
  finalBalance: 4_035_000,
  depositsTotal: 4_035_000,
  withdrawalsTotal: 4_035_000,
  transactionTaxTotalCents: 8009,
  transactionTaxLines: [
    { label: 'Transakčná daň', amountCents: 8003, count: 2 },
    { label: 'Transakčná daň (z poplatkov, úrokov)', amountCents: 3, count: 1 },
  ],
}

async function main() {
  const withPayment = process.argv.includes('--with-payment')
  const outDir = path.join(process.cwd(), 'docs', 'samples')
  fs.mkdirSync(outDir, { recursive: true })

  const emptyHtml = await generateTransactionsPdf({
    ...BASE_INPUT,
    transactions: [],
  })

  const emptyPath = path.join(outDir, 'slsp-sample.html')
  fs.writeFileSync(emptyPath, emptyHtml, 'utf8')
  console.log(`Empty template: ${emptyPath}`)

  if (withPayment) {
    const paymentDescription = encodeTransactionDescription({
      recipientName: 'Ján Kovác',
      note: 'Platba za tovar',
      category: 'Platby',
      recipientAccountOrEmail: 'SK8090000000001234567890',
      variableSymbol: '123456',
    })

    const paymentHtml = await generateTransactionsPdf({
      ...BASE_INPUT,
      statementDate: '15. 08. 2026',
      accountingPeriod: '15. 08. 2026 - 15. 08. 2026',
      statementNumber: '8/2026',
      withdrawalsTotal: 10_000,
      finalBalance: 4_025_000,
      transactionTaxTotalCents: 40,
      transactionTaxLines: [{ label: 'Transakčná daň', amountCents: 40, count: 1 }],
      transactions: [
        {
          id: 'sample-payment-1',
          date: '15. 08. 2026',
          type: 'withdrawal',
          description: paymentDescription,
          amount: 10_000,
          balanceAfter: 4_025_000,
          feeCents: 0,
        },
      ],
    })

    const paymentPath = path.join(outDir, 'slsp-sample-with-payment.html')
    fs.writeFileSync(paymentPath, paymentHtml, 'utf8')
    console.log(`Payment preview: ${paymentPath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
