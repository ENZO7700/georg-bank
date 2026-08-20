/** Shared demo payer used by dashboard2 /transactions seed paths. */
export const DEMO_DEFAULT_USER_ID = 'user-peter-default'

/** Previous demo user ids that may still exist in local DBs. */
export const DEMO_DEFAULT_USER_LEGACY_IDS = ['user-filip-default'] as const

export const DEMO_DEFAULT_USER_NAME = 'Peter'
export const DEMO_DEFAULT_USER_EMAIL = 'peter@example.com'

/** Canonical demo SPACE IBAN (must match ensure-db / Supabase seed). */
export const DEMO_ACCOUNT_NUMBER = 'SK3109000000005012345678'

/** Legacy placeholder that must never appear on payment receipts. */
export const LEGACY_FAKE_SENDER_IBAN = 'SK9009000000000098765432'
