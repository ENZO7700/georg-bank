export const GUEST_USER_EMAIL =
  process.env.GUEST_USER_EMAIL ||
  process.env.NEXT_PUBLIC_DEV_USER_EMAIL ||
  'admin@local.test'

export const GUEST_USER_PASSWORD =
  process.env.GUEST_USER_PASSWORD ||
  process.env.NEXT_PUBLIC_DEV_USER_PASSWORD ||
  'admin1234'

export const GUEST_USER_NAME = 'Peter'

export function guestLoginPath(from = '/dashboard') {
  return `/api/auth/guest?from=${encodeURIComponent(from)}`
}

/**
 * Align the guest credential password with GUEST_USER_PASSWORD.
 * Needed when the guest user already exists (sign-up fails) but was
 * created with a different password — otherwise /api/auth/guest 500s.
 */
export async function syncGuestCredentialPassword() {
  const { hashPassword } = await import('better-auth/crypto')
  const { pool } = await import('@/lib/db')

  const passwordHash = await hashPassword(GUEST_USER_PASSWORD)
  const result = await pool.query(
    `UPDATE account SET password = $1
     FROM "user"
     WHERE account."userId" = "user".id
       AND lower("user".email) = lower($2)
       AND account."providerId" = 'credential'
     RETURNING account.id`,
    [passwordHash, GUEST_USER_EMAIL]
  )

  return (result.rowCount ?? 0) > 0
}