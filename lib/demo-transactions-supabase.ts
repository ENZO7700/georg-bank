import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  DEMO_DEFAULT_USER_EMAIL,
  DEMO_DEFAULT_USER_ID,
  DEMO_DEFAULT_USER_LEGACY_IDS,
  DEMO_DEFAULT_USER_NAME,
} from '@/lib/demo-user'
import {
  DAILY_PAYMENT_LIMIT_EUR,
  dailyLimitSnapshot,
  isOutgoingPaymentType,
  startOfLocalDay,
} from '@/lib/daily-payment-limit'

const DEMO_ACCOUNT_NUMBER = 'SK3109000000005012345678'

type BankAccountRow = {
  id: string
  userId: string
  accountNumber: string
  balance: number | null
  [key: string]: unknown
}

/** Find/create demo account; reclaim legacy Filip rows sharing the demo IBAN. */
async function ensureDemoBankAccount(
  supabase: SupabaseClient,
  defaultUserId: string,
  seedBalanceCents: number
): Promise<BankAccountRow | null> {
  const { data: owned } = await supabase
    .from('bank_account')
    .select('*')
    .eq('userId', defaultUserId)
    .limit(1)
  if (owned?.[0]) return owned[0] as BankAccountRow

  const { data: legacy } = await supabase
    .from('bank_account')
    .select('*')
    .in('userId', [...DEMO_DEFAULT_USER_LEGACY_IDS])
    .limit(1)
  if (legacy?.[0]) {
    const { data: updated, error } = await supabase
      .from('bank_account')
      .update({ userId: defaultUserId, updatedAt: new Date().toISOString() })
      .eq('id', legacy[0].id)
      .select('*')
      .single()
    if (!error && updated) return updated as BankAccountRow
    return { ...(legacy[0] as BankAccountRow), userId: defaultUserId }
  }

  const { data: byIban } = await supabase
    .from('bank_account')
    .select('*')
    .eq('accountNumber', DEMO_ACCOUNT_NUMBER)
    .limit(1)
  if (byIban?.[0]) {
    const { data: updated, error } = await supabase
      .from('bank_account')
      .update({ userId: defaultUserId, updatedAt: new Date().toISOString() })
      .eq('id', byIban[0].id)
      .select('*')
      .single()
    if (!error && updated) return updated as BankAccountRow
    return { ...(byIban[0] as BankAccountRow), userId: defaultUserId }
  }

  const newAccId = `acc-${Date.now()}`
  const { data: created, error: accErr } = await supabase
    .from('bank_account')
    .insert({
      id: newAccId,
      userId: defaultUserId,
      accountNumber: DEMO_ACCOUNT_NUMBER,
      displayName: 'Osobný účet',
      accountType: 'checking',
      balance: seedBalanceCents,
      currency: 'EUR',
      isActive: true,
    })
    .select('*')
    .single()

  if (!accErr && created) return created as BankAccountRow

  // Race / unique conflict: load existing IBAN row and reclaim.
  const { data: conflict } = await supabase
    .from('bank_account')
    .select('*')
    .eq('accountNumber', DEMO_ACCOUNT_NUMBER)
    .limit(1)
  if (conflict?.[0]) {
    await supabase
      .from('bank_account')
      .update({ userId: defaultUserId, updatedAt: new Date().toISOString() })
      .eq('id', conflict[0].id)
    return { ...(conflict[0] as BankAccountRow), userId: defaultUserId }
  }

  if (accErr) throw new Error(accErr.message)
  return null
}

export function createServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type MovementRow = {
  id: string
  recipient: string
  amount: number
  date: string
  createdAt: string
  type: string
  status: string
  note?: string | null
  balanceBefore?: number
  balanceAfter?: number
}

function mapTxn(t: {
  id: string
  description: string | null
  amount: number
  createdAt: string
  type: string
  status: string
  balanceBefore: number | null
  balanceAfter: number | null
}): MovementRow {
  return {
    id: t.id,
    recipient: t.description || 'Platba',
    amount: t.amount / 100,
    date: new Date(t.createdAt).toLocaleDateString('sk-SK'),
    createdAt: new Date(t.createdAt).toISOString(),
    type: t.type,
    status: t.status,
    note: t.description,
    balanceBefore: t.balanceBefore != null ? t.balanceBefore / 100 : undefined,
    balanceAfter: t.balanceAfter != null ? t.balanceAfter / 100 : undefined,
  }
}

export async function listMovementsViaSupabase(limit = 100) {
  const supabase = createServiceSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('transaction')
    .select(
      'id, description, amount, createdAt, type, status, balanceBefore, balanceAfter, userId'
    )
    .order('createdAt', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const todayStart = startOfLocalDay().toISOString()
  const usedCents = (data ?? [])
    .filter(
      (t) =>
        t.userId === DEMO_DEFAULT_USER_ID &&
        isOutgoingPaymentType(t.type) &&
        t.createdAt >= todayStart
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // If today's rows fell outside the last `limit`, re-query today's usage.
  const { data: todayRows, error: todayErr } = await supabase
    .from('transaction')
    .select('amount, type, userId, createdAt')
    .eq('userId', DEMO_DEFAULT_USER_ID)
    .gte('createdAt', todayStart)

  if (todayErr) throw new Error(todayErr.message)

  const usedToday = (todayRows ?? [])
    .filter((t) => isOutgoingPaymentType(t.type))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return {
    transactions: (data ?? []).map(mapTxn),
    dailyLimit: dailyLimitSnapshot(usedToday || usedCents),
  }
}

export async function createMovementViaSupabase(input: {
  recipient: string
  iban?: string
  vs?: string
  amount: number
  note?: string
  type?: string
  category?: string
}) {
  const supabase = createServiceSupabase()
  if (!supabase) return null

  const amountInCents = Math.round(Number(input.amount) * 100)
  if (!amountInCents || amountInCents <= 0) {
    return { error: 'Zadajte platnú sumu', status: 400 as const }
  }

  const type = input.type || 'outgoing'
  const isOutgoing = isOutgoingPaymentType(type)
  const newTxnId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const defaultUserId = DEMO_DEFAULT_USER_ID

  await supabase.from('user').upsert(
    {
      id: defaultUserId,
      name: DEMO_DEFAULT_USER_NAME,
      email: DEMO_DEFAULT_USER_EMAIL,
      emailVerified: true,
      updatedAt: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  const SEED_BALANCE_CENTS = 10_000
  let account = await ensureDemoBankAccount(supabase, defaultUserId, SEED_BALANCE_CENTS)
  if (!account) {
    return { error: 'Nepodarilo sa pripraviť demo účet', status: 500 as const }
  }

  const todayStart = startOfLocalDay().toISOString()
  const { data: todayRows, error: todayErr } = await supabase
    .from('transaction')
    .select('amount, type')
    .eq('userId', defaultUserId)
    .gte('createdAt', todayStart)

  if (todayErr) throw new Error(todayErr.message)

  const usedCents = (todayRows ?? [])
    .filter((t) => isOutgoingPaymentType(t.type))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  let dailyLimit = dailyLimitSnapshot(usedCents)

  if (isOutgoing && amountInCents > dailyLimit.remainingCents) {
    return {
      error: `Denný limit ${DAILY_PAYMENT_LIMIT_EUR} € je vyčerpaný. Zostáva ${dailyLimit.remainingEur.toFixed(2)} €.`,
      status: 403 as const,
      dailyLimit,
    }
  }

  const currentBalanceCents = account.balance ?? SEED_BALANCE_CENTS
  const newBalanceCents =
    type === 'incoming' || type === 'deposit'
      ? currentBalanceCents + amountInCents
      : currentBalanceCents - amountInCents

  await supabase
    .from('bank_account')
    .update({ balance: newBalanceCents, updatedAt: new Date().toISOString() })
    .eq('id', account.id)

  const fullDescription = [
    input.recipient,
    input.note ? `(${input.note})` : '',
    input.iban ? `IBAN: ${input.iban}` : '',
    input.vs ? `VS: ${input.vs}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const now = new Date().toISOString()
  const { error: txnErr } = await supabase.from('transaction').insert({
    id: newTxnId,
    userId: defaultUserId,
    fromAccountId: account.id,
    amount: amountInCents,
    balanceBefore: currentBalanceCents,
    balanceAfter: newBalanceCents,
    type,
    description: fullDescription,
    status: 'completed',
    createdAt: now,
    updatedAt: now,
  })

  if (txnErr) throw new Error(txnErr.message)

  if (isOutgoing) {
    dailyLimit = dailyLimitSnapshot(dailyLimit.usedCents + amountInCents)
  }

  return {
    dailyLimit,
    transaction: {
      id: newTxnId,
      recipient: input.recipient,
      iban: input.iban,
      vs: input.vs,
      amount: Number(input.amount),
      date: new Date().toLocaleDateString('sk-SK'),
      createdAt: now,
      note: input.note,
      type,
      status: 'Spracované',
      balanceBefore: currentBalanceCents / 100,
      balanceAfter: newBalanceCents / 100,
      category: input.category,
    },
  }
}
