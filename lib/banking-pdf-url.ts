import { db } from '@/lib/db'
import { transaction } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPaymentConfirmationApiPath } from '@/lib/payment-confirmation-from-transaction'

export async function attachPaymentConfirmationUrl(transactionId: string) {
  const pdfUrl = getPaymentConfirmationApiPath(transactionId)
  await db.update(transaction).set({ pdfUrl }).where(eq(transaction.id, transactionId))
  return pdfUrl
}