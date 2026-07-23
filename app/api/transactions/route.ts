import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transaction, bankAccount, user } from '@/lib/db/schema'
import {
  DEMO_DEFAULT_USER_EMAIL,
  DEMO_DEFAULT_USER_ID,
  DEMO_DEFAULT_USER_LEGACY_IDS,
  DEMO_DEFAULT_USER_NAME,
} from '@/lib/demo-user'
import { desc, eq, inArray } from 'drizzle-orm'

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
    const defaultUserId = DEMO_DEFAULT_USER_ID
    const existingUser = await db.query.user.findFirst({
      where: (t, { eq }) => eq(t.id, defaultUserId),
    })

    if (!existingUser) {
      // Migrate leftover local rows that still use a legacy demo user id.
      const legacyUsers = await db.query.user.findMany({
        where: (t, { inArray: inArr }) =>
          inArr(t.id, [...DEMO_DEFAULT_USER_LEGACY_IDS]),
      })
      if (legacyUsers.length > 0) {
        for (const legacyId of DEMO_DEFAULT_USER_LEGACY_IDS) {
          await db
            .update(user)
            .set({
              email: `migrated-${legacyId}@local.test`,
              updatedAt: new Date(),
            })
            .where(eq(user.id, legacyId))
        }
        await db.insert(user).values({
          id: defaultUserId,
          name: DEMO_DEFAULT_USER_NAME,
          email: DEMO_DEFAULT_USER_EMAIL,
          emailVerified: true,
        }).onConflictDoNothing()
        await db
          .update(bankAccount)
          .set({ userId: defaultUserId, updatedAt: new Date() })
          .where(inArray(bankAccount.userId, [...DEMO_DEFAULT_USER_LEGACY_IDS]))
        await db
          .update(transaction)
          .set({ userId: defaultUserId, updatedAt: new Date() })
          .where(inArray(transaction.userId, [...DEMO_DEFAULT_USER_LEGACY_IDS]))
        for (const legacyId of DEMO_DEFAULT_USER_LEGACY_IDS) {
          await db.delete(user).where(eq(user.id, legacyId))
        }
      } else {
        await db.insert(user).values({
          id: defaultUserId,
          name: DEMO_DEFAULT_USER_NAME,
          email: DEMO_DEFAULT_USER_EMAIL,
          emailVerified: true,
        }).onConflictDoNothing()
      }
    } else if (
      existingUser.name !== DEMO_DEFAULT_USER_NAME ||
      existingUser.email !== DEMO_DEFAULT_USER_EMAIL
    ) {
      await db
        .update(user)
        .set({
          name: DEMO_DEFAULT_USER_NAME,
          email: DEMO_DEFAULT_USER_EMAIL,
          updatedAt: new Date(),
        })
        .where(eq(user.id, defaultUserId))
    }

    // Find or create default bank account
    let accountRecord = await db.query.bankAccount.findFirst({
      where: (t, { eq }) => eq(t.userId, defaultUserId),
    })

    if (!accountRecord) {
      const legacyAccount = await db.query.bankAccount.findFirst({
        where: (t, { inArray: inArr }) =>
          inArr(t.userId, [...DEMO_DEFAULT_USER_LEGACY_IDS]),
      })
      if (legacyAccount) {
        await db
          .update(bankAccount)
          .set({ userId: defaultUserId, updatedAt: new Date() })
          .where(eq(bankAccount.id, legacyAccount.id))
        accountRecord = { ...legacyAccount, userId: defaultUserId }
      }
    }

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
