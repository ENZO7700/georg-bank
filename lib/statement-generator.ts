import type { TransactionRow } from '@/lib/generate-transactions-pdf'
import { v4 as uuidv4 } from 'uuid'
import { categorizeTransaction } from './categories'

const TIMEZONE = 'Europe/Bratislava'

const BANK_CODES = ['0900', '0200', '1100', '7500', '8360', '5200'] as const

const OUTGOING_COUNTERPARTIES = [
  'Tesco Stores SR',
  'Západoslovenská distribučná',
  'Alza.sk',
  'Daňový úrad SR',
  'O2 Slovakia',
  'Slovak Telekom',
  'Shell Slovakia',
  'Lidl Slovenská republika',
] as const

const INCOMING_COUNTERPARTIES = [
  'Klient Alpha s.r.o.',
  'Beta Consulting s.r.o.',
  'Faktúra 2026/04',
  'Refund Alza.sk',
  'Príjem z fakturácie',
] as const

export interface StatementMix {
  outgoing: number
  incoming: number
  topup: number
}

export interface StatementGeneratorConfig {
  transactionsPerMonth: number
  averageMonthlyTurnoverEur: number
  mix: StatementMix
  monthsCount?: number
  initialBalanceCents?: number
  accountNumber: string
  seed?: number
}

export interface GeneratedStatementEntry {
  id: string
  createdAt: Date
  type: 'withdrawal' | 'deposit'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
}

export interface GeneratedMonthStatement {
  month: string
  periodStart: Date
  periodEnd: Date
  transactions: TransactionRow[]
  entries: GeneratedStatementEntry[]
  initialBalance: number
  finalBalance: number
  depositsTotal: number
  withdrawalsTotal: number
}

export interface GeneratedStatementTransaction {
  id: string
  userId: string
  fromAccountId: string
  toAccountId: string | null
  amount: number
  balanceBefore: number
  balanceAfter: number
  type: 'deposit' | 'withdrawal' | 'transfer'
  description: string
  status: 'completed'
  createdAt: Date
}

function createRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function normalizeMix(mix: StatementMix) {
  const total = mix.outgoing + mix.incoming + mix.topup
  if (total <= 0) {
    return { outgoing: 70, incoming: 20, topup: 10 }
  }
  return {
    outgoing: (mix.outgoing / total) * 100,
    incoming: (mix.incoming / total) * 100,
    topup: (mix.topup / total) * 100,
  }
}

function getZonedParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  }
}

function zonedDate(year: number, month: number, day: number, hour = 12, minute = 0) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const parts = getZonedParts(utcGuess)
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  const actualUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return new Date(targetUtc + (targetUtc - actualUtc))
}

function getRecentMonthStarts(count: number, referenceDate = new Date()) {
  const { year, month } = getZonedParts(referenceDate)
  const months: Array<{ year: number; month: number; key: string }> = []

  for (let offset = 1; offset <= count; offset += 1) {
    let targetMonth = month - offset
    let targetYear = year
    while (targetMonth <= 0) {
      targetMonth += 12
      targetYear -= 1
    }
    months.push({
      year: targetYear,
      month: targetMonth,
      key: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
    })
  }

  return months
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function randomWeekdayDate(year: number, month: number, rng: () => number) {
  const totalDays = daysInMonth(year, month)
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const day = 1 + Math.floor(rng() * totalDays)
    const date = zonedDate(year, month, day, 9 + Math.floor(rng() * 8), Math.floor(rng() * 60))
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      weekday: 'short',
    }).format(date)
    if (!['Sat', 'Sun'].includes(weekday)) {
      return date
    }
  }
  return zonedDate(year, month, 1 + Math.floor(rng() * totalDays), 12, 0)
}

function randomIban(rng: () => number) {
  const bankCode = BANK_CODES[Math.floor(rng() * BANK_CODES.length)]
  const account = String(Math.floor(10_000_000_000 + rng() * 89_999_999_999))
  const raw = `SK68${bankCode}0000${account}`
  return `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)} ${raw.slice(12, 16)} ${raw.slice(16, 20)} ${raw.slice(20, 24)}`
}

function splitCounts(total: number, mix: StatementMix) {
  const normalized = normalizeMix(mix)
  let outgoing = Math.max(0, Math.round((total * normalized.outgoing) / 100))
  let incoming = Math.max(0, Math.round((total * normalized.incoming) / 100))
  let topup = Math.max(0, total - outgoing - incoming)

  if (outgoing + incoming + topup === 0) {
    return { outgoing: total, incoming: 0, topup: 0 }
  }

  while (outgoing + incoming + topup > total) {
    if (topup > 0) topup -= 1
    else if (incoming > 0) incoming -= 1
    else outgoing -= 1
  }

  while (outgoing + incoming + topup < total) {
    topup += 1
  }

  return { outgoing, incoming, topup }
}

function buildAmounts(count: number, targetTurnoverCents: number, rng: () => number) {
  if (count <= 0) return [] as number[]

  const minAmount = 500
  const maxAmount = 250_000
  const amounts: number[] = []

  for (let index = 0; index < count; index += 1) {
    const randomAmount = minAmount + Math.floor(rng() * (maxAmount - minAmount))
    amounts.push(randomAmount)
  }

  const currentTotal = amounts.reduce((sum, value) => sum + value, 0)
  if (currentTotal === 0) return amounts

  const scaled = amounts.map((amount) =>
    Math.max(minAmount, Math.round((amount / currentTotal) * targetTurnoverCents)),
  )

  const scaledTotal = scaled.reduce((sum, value) => sum + value, 0)
  const delta = targetTurnoverCents - scaledTotal
  scaled[scaled.length - 1] = Math.max(minAmount, scaled[scaled.length - 1] + delta)

  return scaled
}

function formatTxnDate(date: Date) {
  const parts = getZonedParts(date)
  const day = String(parts.day).padStart(2, '0')
  const month = String(parts.month).padStart(2, '0')
  return `${day}.${month}.${parts.year}`
}

function buildDescription(
  type: 'withdrawal' | 'deposit',
  rng: () => number,
  amountCents: number,
) {
  if (type === 'deposit') {
    const name = INCOMING_COUNTERPARTIES[Math.floor(rng() * INCOMING_COUNTERPARTIES.length)]
    const note = 'Prijatá platba'
    const category = categorizeTransaction(name, note, 'deposit')
    return `${name}|${note}|${category}|${randomIban(rng)}|||`
  }

  const name = OUTGOING_COUNTERPARTIES[Math.floor(rng() * OUTGOING_COUNTERPARTIES.length)]
  const note = `Platba ${(amountCents / 100).toFixed(2)} EUR`
  const category = categorizeTransaction(name, note, 'withdrawal')
  return `${name}|${note}|${category}|${randomIban(rng)}|||`
}

export function generateMonthStatement(
  year: number,
  month: number,
  config: StatementGeneratorConfig,
  startingBalanceCents: number,
  rng: () => number,
): GeneratedMonthStatement {
  const counts = splitCounts(config.transactionsPerMonth, config.mix)
  const targetTurnoverCents = Math.round(config.averageMonthlyTurnoverEur * 100)
  const withdrawalAmounts = buildAmounts(counts.outgoing, Math.round(targetTurnoverCents * 0.55), rng)
  const incomingAmounts = buildAmounts(counts.incoming, Math.round(targetTurnoverCents * 0.35), rng)
  const topupAmounts = buildAmounts(counts.topup, Math.round(targetTurnoverCents * 0.10), rng)

  type DraftTxn = {
    type: 'withdrawal' | 'deposit'
    amount: number
    createdAt: Date
    description: string
  }

  const drafts: DraftTxn[] = []

  for (const amount of withdrawalAmounts) {
    const createdAt = randomWeekdayDate(year, month, rng)
    drafts.push({
      type: 'withdrawal',
      amount,
      createdAt,
      description: buildDescription('withdrawal', rng, amount),
    })
  }

  for (const amount of incomingAmounts) {
    const createdAt = randomWeekdayDate(year, month, rng)
    drafts.push({
      type: 'deposit',
      amount,
      createdAt,
      description: buildDescription('deposit', rng, amount),
    })
  }

  for (const amount of topupAmounts) {
    const createdAt = randomWeekdayDate(year, month, rng)
    drafts.push({
      type: 'deposit',
      amount,
      createdAt,
      description: `Dobitie účtu|Vklad v hotovosti|Ostatné nepravidelné príjmy||||`,
    })
  }

  drafts.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())

  let balance = startingBalanceCents
  let depositsTotal = 0
  let withdrawalsTotal = 0
  const initialBalance = balance

  const entries: GeneratedStatementEntry[] = []
  const transactions: TransactionRow[] = drafts.map((draft) => {
    const balanceBefore = balance
    const id = uuidv4()
    if (draft.type === 'withdrawal') {
      balance -= draft.amount
      withdrawalsTotal += draft.amount
    } else {
      balance += draft.amount
      depositsTotal += draft.amount
    }

    entries.push({
      id,
      createdAt: draft.createdAt,
      type: draft.type,
      amount: draft.amount,
      balanceBefore,
      balanceAfter: balance,
      description: draft.description,
    })

    return {
      id,
      date: formatTxnDate(draft.createdAt),
      type: draft.type,
      description: draft.description,
      amount: draft.amount,
      balanceAfter: balance,
    }
  })

  const periodStart = zonedDate(year, month, 1, 0, 0)
  const periodEnd = zonedDate(year, month, daysInMonth(year, month), 23, 59)

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    periodStart,
    periodEnd,
    transactions,
    entries,
    initialBalance,
    finalBalance: balance,
    depositsTotal,
    withdrawalsTotal,
  }
}

export function generateBulkStatements(config: StatementGeneratorConfig) {
  const months = getRecentMonthStarts(config.monthsCount ?? 3)
  const rng = createRng(config.seed ?? 42)
  let rollingBalance = config.initialBalanceCents ?? 500_000

  return months.map(({ year, month }) => {
    const statement = generateMonthStatement(year, month, config, rollingBalance, rng)
    rollingBalance = statement.finalBalance
    return statement
  })
}

export function toPersistableTransactions(
  statements: GeneratedMonthStatement[],
  userId: string,
  accountId: string,
): GeneratedStatementTransaction[] {
  return statements.flatMap((statement) =>
    statement.entries.map((entry) => ({
      id: entry.id,
      userId,
      fromAccountId: accountId,
      toAccountId: entry.type === 'withdrawal' ? null : accountId,
      amount: entry.amount,
      balanceBefore: entry.balanceBefore,
      balanceAfter: entry.balanceAfter,
      type: entry.type,
      description: entry.description,
      status: 'completed' as const,
      createdAt: entry.createdAt,
    })),
  )
}