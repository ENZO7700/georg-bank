import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transaction, bankAccount, user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    const records = await db.query.transaction.findMany({
      orderBy: [desc(transaction.createdAt)],
      limit: 100,
    })

    const accounts = await db.query.bankAccount.findMany()

    return NextResponse.json({
      success: true,
      transactions: records.map((t) => ({
        id: t.id,
        recipient: t.description || 'Platba',
        amount: t.amount / 100,
        date: new Date(t.createdAt).toLocaleDateString('sk-SK'),
        createdAt: new Date(t.createdAt).toISOString(),
        type: t.type,
        status: t.status,
        note: t.description,
        balanceBefore: t.balanceBefore ? t.balanceBefore / 100 : undefined,
        balanceAfter: t.balanceAfter ? t.balanceAfter / 100 : undefined,
      })),
      accounts,
    })
  } catch (error) {
    console.error('[API /api/transactions GET] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { recipient, iban, vs, amount, note, type = 'outgoing', category = 'Platba' } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Zadajte platnú sumu' }, { status: 400 })
    }

    const amountInCents = Math.round(Number(amount) * 100)
    const newTxnId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    // Ensure seed default user exists in database
    const defaultUserId = 'user-filip-default'
    const existingUser = await db.query.user.findFirst({
      where: (t, { eq }) => eq(t.id, defaultUserId),
    })

    if (!existingUser) {
      await db.insert(user).values({
        id: defaultUserId,
        name: 'Filip',
        email: 'filip@example.com',
        emailVerified: true,
      }).onConflictDoNothing()
    }

    // Find or create default bank account
    let accountRecord = await db.query.bankAccount.findFirst({
      where: (t, { eq }) => eq(t.userId, defaultUserId),
    })

    // €100 seed so CI / multi-test runs do not exhaust the shared demo account
    const SEED_BALANCE_CENTS = 10_000

    if (!accountRecord) {
      const newAccId = `acc-${Date.now()}`
      await db.insert(bankAccount).values({
        id: newAccId,
        userId: defaultUserId,
        accountNumber: 'SK3109000000005012345678',
        displayName: 'Osobný účet',
        accountType: 'checking',
        balance: SEED_BALANCE_CENTS,
        currency: 'EUR',
        isActive: true,
      }).onConflictDoNothing()

      accountRecord = await db.query.bankAccount.findFirst({
        where: (t, { eq }) => eq(t.id, newAccId),
      })
    }

    const currentBalanceCents = accountRecord?.balance ?? SEED_BALANCE_CENTS
    const newBalanceCents = type === 'incoming' || type === 'deposit'
      ? currentBalanceCents + amountInCents
      : currentBalanceCents - amountInCents

    // Update account balance in Supabase DB
    if (accountRecord) {
      await db
        .update(bankAccount)
        .set({ balance: newBalanceCents, updatedAt: new Date() })
        .where(eq(bankAccount.id, accountRecord.id))
    }

    const fullDescription = [recipient, note ? `(${note})` : '', iban ? `IBAN: ${iban}` : '', vs ? `VS: ${vs}` : '']
      .filter(Boolean)
      .join(' ')

    // Insert transaction into Supabase DB
    await db.insert(transaction).values({
      id: newTxnId,
      userId: defaultUserId,
      fromAccountId: accountRecord?.id,
      amount: amountInCents,
      balanceBefore: currentBalanceCents,
      balanceAfter: newBalanceCents,
      type: type,
      description: fullDescription,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: newTxnId,
        recipient,
        iban,
        vs,
        amount: Number(amount),
        date: new Date().toLocaleDateString('sk-SK'),
        createdAt: new Date().toISOString(),
        note,
        type,
        status: 'Spracované',
        balanceBefore: currentBalanceCents / 100,
        balanceAfter: newBalanceCents / 100,
        category,
      },
    })
  } catch (error) {
    console.error('[API /api/transactions POST] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
