import type { TransactionRow, TransactionTaxLine } from '@/lib/generate-transactions-pdf'

/** SK transakčná daň — 0,40 % z odchádzajúcich platieb (demo sadzba podľa SLSP výpisu). */
export const TRANSACTION_TAX_RATE = 0.004

/** Daň z poplatkov / úrokov — 20 % z bankového poplatku. */
export const FEE_TAX_RATE = 0.2

export function isOutgoingTransaction(type: string): boolean {
  return type === 'withdrawal' || type === 'transfer'
}

export function resolveTransactionFeeCents(txn: TransactionRow): number {
  if (typeof txn.feeCents === 'number' && txn.feeCents >= 0) {
    return txn.feeCents
  }

  if (txn.description?.includes('|')) {
    const parts = txn.description.split('|')
    const rawFee = parts[5]?.trim()
    if (rawFee) {
      const parsed = Number.parseInt(rawFee, 10)
      if (Number.isFinite(parsed) && parsed >= 0) return parsed
    }
  }

  return 0
}

export function computeStatementTax(transactions: TransactionRow[]): {
  totalCents: number
  lines: TransactionTaxLine[]
} {
  const outgoing = transactions.filter((txn) => isOutgoingTransaction(txn.type))
  let transactionTaxCents = 0
  let feeTaxCents = 0
  let feeTaxCount = 0

  for (const txn of outgoing) {
    transactionTaxCents += Math.round(txn.amount * TRANSACTION_TAX_RATE)

    const feeCents = resolveTransactionFeeCents(txn)
    if (feeCents > 0) {
      feeTaxCents += Math.round(feeCents * FEE_TAX_RATE)
      feeTaxCount += 1
    }
  }

  const lines: TransactionTaxLine[] = []

  if (outgoing.length > 0 && transactionTaxCents > 0) {
    lines.push({
      label: 'Transakčná daň',
      amountCents: transactionTaxCents,
      count: outgoing.length,
    })
  }

  if (feeTaxCount > 0 && feeTaxCents > 0) {
    lines.push({
      label: 'Transakčná daň (z poplatkov, úrokov)',
      amountCents: feeTaxCents,
      count: feeTaxCount,
    })
  }

  return {
    totalCents: transactionTaxCents + feeTaxCents,
    lines,
  }
}
