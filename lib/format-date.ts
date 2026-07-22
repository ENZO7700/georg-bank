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