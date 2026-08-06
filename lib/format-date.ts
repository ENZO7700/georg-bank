const SK_TIMEZONE = 'Europe/Bratislava'

export function formatTransactionDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SK_TIMEZONE,
  }).format(new Date(value))
}

export function formatTransactionDateMedium(value: string | Date) {
  return new Intl.DateTimeFormat('sk-SK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: SK_TIMEZONE,
  }).format(new Date(value))
}

export function formatTransactionDateLong(value: string | Date) {
  return new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    month: 'long',
    timeZone: SK_TIMEZONE,
  }).format(new Date(value)).replace('.', '')
}

function readZonedParts(value: string | Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date(value))
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0'

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
  }
}

/** SLSP výpis: `31. 03. 2026` */
export function formatSlspStatementDate(value: string | Date) {
  const { day, month, year } = readZonedParts(value)
  return `${day}. ${month}. ${year}`
}

/** SLSP výpis: `01. 03. 2026 - 31. 03. 2026` */
export function formatSlspAccountingPeriod(start: string | Date, end: string | Date) {
  return `${formatSlspStatementDate(start)} - ${formatSlspStatementDate(end)}`
}

/** SLSP meta: `3/2026` */
export function formatSlspStatementNumber(value: string | Date) {
  const { month, year } = readZonedParts(value)
  return `${Number(month)}/${year}`
}