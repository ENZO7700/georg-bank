import { config } from 'dotenv'
import { and, eq, isNull, or } from 'drizzle-orm'
import { attachPaymentConfirmationUrl } from '../lib/banking-pdf-url'
import { db } from '../lib/db'
import { transaction } from '../lib/db/schema'

config({ path: '.env.local' })
config({ path: '.env' })

async function main() {
  const rows = await db
    .select({ id: transaction.id, type: transaction.type, pdfUrl: transaction.pdfUrl })
    .from(transaction)
    .where(
      and(
        or(eq(transaction.type, 'withdrawal'), eq(transaction.type, 'transfer')),
        or(isNull(transaction.pdfUrl), eq(transaction.pdfUrl, '')),
      ),
    )

  if (rows.length === 0) {
    console.log('Žiadne transakcie na backfill.')
    return
  }

  console.log(`Backfill pdfUrl pre ${rows.length} transakcií...`)

  for (const row of rows) {
    const pdfUrl = await attachPaymentConfirmationUrl(row.id)
    console.log(`  ${row.id} (${row.type}) → ${pdfUrl}`)
  }

  console.log('Hotovo.')
}

main().catch((error) => {
  console.error('Backfill zlyhal:', error)
  process.exit(1)
})