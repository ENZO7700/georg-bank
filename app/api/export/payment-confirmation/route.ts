import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bankAccount, transaction } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { buildPaymentConfirmationFromTransaction } from '@/lib/payment-confirmation-from-transaction'
import {
  generatePaymentConfirmationHtml,
  getPaymentConfirmationFilename,
} from '@/lib/payment-confirmation-pdf'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const transactionId = url.searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
    }

    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const txnResult = await db
      .select()
      .from(transaction)
      .where(
        and(
          eq(transaction.id, transactionId),
          eq(transaction.userId, session.user.id),
        ),
      )
      .limit(1)

    const txn = txnResult[0]
    if (!txn) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (txn.type !== 'withdrawal' && txn.type !== 'transfer') {
      return NextResponse.json({ error: 'Confirmation available only for outgoing payments' }, { status: 400 })
    }

    const accountId = txn.fromAccountId
    if (!accountId) {
      return NextResponse.json({ error: 'Missing source account' }, { status: 400 })
    }

    const accountResult = await db
      .select()
      .from(bankAccount)
      .where(
        and(
          eq(bankAccount.id, accountId),
          eq(bankAccount.userId, session.user.id),
        ),
      )
      .limit(1)

    const account = accountResult[0]
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const confirmation = buildPaymentConfirmationFromTransaction(txn, account)
    const htmlContent = generatePaymentConfirmationHtml(confirmation)

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${getPaymentConfirmationFilename(confirmation)}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating payment confirmation:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}