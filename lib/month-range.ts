/** Mesiac zobrazený na /dashboardpayment a v exporte výpisu */
export const PAYMENT_OVERVIEW_MONTH = '2026-04'

export function parseMonthParam(month: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim())
  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2])
  if (!Number.isFinite(year) || monthIndex < 1 || monthIndex > 12) return null

  return { year, month: monthIndex }
}

/** UTC rozsah [start, end) pre kalendárny mesiac — konzistentné s DB dotazmi */
export function getMonthUtcRange(month: string): { start: Date; end: Date } | null {
  const parsed = parseMonthParam(month)
  if (!parsed) return null

  const { year, month: monthIndex } = parsed
  return {
    start: new Date(Date.UTC(year, monthIndex - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0)),
  }
}

export function formatMonthLabel(month: string, locale = 'sk-SK'): string {
  const parsed = parseMonthParam(month)
  if (!parsed) return month

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, 15))
  const label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}