/**
 * Writes the SLSP statement samples used for visual comparison with
 * docs/templates/slsp_35db-reference.pdf:
 *
 *   docs/samples/slsp-sample.html              data-free skeleton ({{ tokens }})
 *   docs/samples/slsp-sample-with-payment.html  same skeleton filled from one payment
 *
 * Run: npx tsx scripts/generate-slsp-sample.ts
 */
import fs from 'fs'
import path from 'path'
import {
  generateTransactionsPdf,
  renderStatementSkeletonHtml,
} from '../lib/generate-transactions-pdf'
import { buildStatementFromPayment } from '../lib/statement-from-payment'

async function main() {
  const outDir = path.join(process.cwd(), 'docs', 'samples')
  fs.mkdirSync(outDir, { recursive: true })

  const skeletonPath = path.join(outDir, 'slsp-sample.html')
  fs.writeFileSync(skeletonPath, renderStatementSkeletonHtml(), 'utf8')
  console.log(`Skeleton: ${skeletonPath}`)

  const statement = buildStatementFromPayment(
    {
      id: 'payment-preview',
      date: '2026-08-06T09:30:00.000Z',
      recipientName: 'Ján Kovác',
      recipientIban: 'SK8090000000001234567890',
      amountCents: 10_000,
      variableSymbol: '123456',
      note: 'Platba za tovar',
    },
    {
      currency: 'EUR',
      productLabel: 'Osobný účet',
      holderAddressLines: ['Hlavná 1', '811 01 Bratislava'],
    },
  )

  const paymentPath = path.join(outDir, 'slsp-sample-with-payment.html')
  fs.writeFileSync(paymentPath, await generateTransactionsPdf(statement), 'utf8')
  console.log(`Payment preview: ${paymentPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
