/** Daily outgoing payment allowance for the demo payer (EUR). */
export const DAILY_PAYMENT_LIMIT_EUR = 2000
export const DAILY_PAYMENT_LIMIT_CENTS = DAILY_PAYMENT_LIMIT_EUR * 100

export function startOfLocalDay(date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isOutgoingPaymentType(type: string | null | undefined): boolean {
  return type === 'outgoing' || type === 'withdrawal' || type === 'transfer'
}

export function dailyLimitSnapshot(usedCents: number) {
  const used = Math.max(0, usedCents)
  const remainingCents = Math.max(0, DAILY_PAYMENT_LIMIT_CENTS - used)
  return {
    limitEur: DAILY_PAYMENT_LIMIT_EUR,
    usedEur: used / 100,
    remainingEur: remainingCents / 100,
    usedCents: used,
    remainingCents,
    limitCents: DAILY_PAYMENT_LIMIT_CENTS,
  }
}
