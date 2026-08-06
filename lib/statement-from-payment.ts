import {
  formatSlspAccountingPeriod,
  formatSlspStatementDate,
  formatSlspStatementNumber,
} from '@/lib/format-date'
import type { TransactionRow, TransactionsPdfInput } from '@/lib/generate-transactions-pdf'
import { computeStatementTax } from '@/lib/statement-tax'
import { StatementPdfValidationError } from '@/lib/statement-pdf-profile'

export interface StatementPaymentInput {
  id: string
  date: Date | string
  recipientName: string
  recipientIban: string
  amountCents: number
  variableSymbol?: string
  note?: string
  feeCents?: number
}

export interface StatementPaymentAccountInput {
  currency?: string | null
  productLabel?: string | null
  holderAddressLines: string[]
  initialBalanceCents?: number
}

function encodePaymentDescription(payment: StatementPaymentInput): string {
  return [
    payment.recipientName,
    payment.note ?? '',
    '',
    payment.recipientIban,
    payment.variableSymbol ?? '',
    payment.feeCents ? String(payment.feeCents) : '',
    '',
    '',
  ].join('|')
}

/**
 * Builds statement input from a single outgoing payment. Every value on the
 * statement comes from the payment or the payer's account — no demo data.
 */
export function buildStatementFromPayment(
  payment: StatementPaymentInput,
  account: StatementPaymentAccountInput,
): TransactionsPdfInput {
  if (!payment.recipientName.trim()) {
    throw new StatementPdfValidationError('Platba musí obsahovať názov príjemcu.')
  }
  if (!payment.recipientIban.trim()) {
    throw new StatementPdfValidationError('Platba musí obsahovať IBAN príjemcu.')
  }
  if (!Number.isFinite(payment.amountCents) || payment.amountCents <= 0) {
    throw new StatementPdfValidationError('Suma platby musí byť väčšia ako nula.')
  }

  const isoDate = new Date(payment.date).toISOString()
  const statementDate = formatSlspStatementDate(isoDate)

  const transactions: TransactionRow[] = [
    {
      id: payment.id,
      date: statementDate,
      type: 'withdrawal',
      description: encodePaymentDescription(payment),
      amount: payment.amountCents,
      balanceAfter: null,
      feeCents: payment.feeCents ?? 0,
    },
  ]

  const tax = computeStatementTax(transactions)
  const feeCents = payment.feeCents ?? 0
  const initialBalance = account.initialBalanceCents ?? 0
  const withdrawalsTotal = payment.amountCents + feeCents
  const finalBalance = initialBalance - withdrawalsTotal - tax.totalCents

  transactions[0].balanceAfter = finalBalance

  const accountName = payment.recipientName.trim()

  return {
    accountName,
    accountNumber: payment.recipientIban.trim(),
    currency: account.currency || 'EUR',
    accountProductType: account.productLabel?.trim() || 'Osobný účet',
    holderAddressLines: [accountName, ...account.holderAddressLines],
    statementDate,
    accountingPeriod: formatSlspAccountingPeriod(isoDate, isoDate),
    statementNumber: formatSlspStatementNumber(isoDate),
    transactions,
    initialBalance,
    finalBalance,
    depositsTotal: 0,
    withdrawalsTotal,
    transactionTaxTotalCents: tax.totalCents,
    transactionTaxLines: tax.lines,
  }
}
