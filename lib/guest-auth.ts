const DEFAULT_GUEST_EMAIL = 'admin@local.test'
const DEFAULT_GUEST_PASSWORD = 'admin1234'

function resolveGuestEmail() {
  const configured =
    process.env.GUEST_USER_EMAIL ||
    process.env.NEXT_PUBLIC_DEV_USER_EMAIL ||
    DEFAULT_GUEST_EMAIL
  if (!configured.trim().toLowerCase().endsWith('@local.test')) {
    console.error(
      '[guest-auth] GUEST_USER_EMAIL must end with @local.test; falling back to',
      DEFAULT_GUEST_EMAIL,
      '(got:',
      configured,
      ')'
    )
    return DEFAULT_GUEST_EMAIL
  }
  return configured
}

export const GUEST_USER_EMAIL = resolveGuestEmail()

export const GUEST_USER_PASSWORD =
  process.env.GUEST_USER_PASSWORD ||
  process.env.NEXT_PUBLIC_DEV_USER_PASSWORD ||
  DEFAULT_GUEST_PASSWORD

export const GUEST_USER_NAME = 'Peter'

/** Dedicated guest inbox — never point GUEST_USER_EMAIL at a real person's mailbox. */
export function isDedicatedGuestEmail(email: string) {
  return email.trim().toLowerCase().endsWith('@local.test')
}

export function guestLoginPath(from = '/dashboard2') {
  return `/api/auth/guest?from=${encodeURIComponent(from)}`
}

/**
 * Align the guest credential password with GUEST_USER_PASSWORD.
 * Needed when the guest user already exists (sign-up fails) but was
 * created with a different password — otherwise /api/auth/guest 500s.
 *
 * Refuses to overwrite credentials when GUEST_USER_EMAIL is not a
 * dedicated @local.test address (misconfig would reset a real user).
 */
export async function syncGuestCredentialPassword() {
  if (!isDedicatedGuestEmail(GUEST_USER_EMAIL)) {
    console.error(
      '[guest-auth] Refusing password sync: GUEST_USER_EMAIL must be a dedicated @local.test address, got:',
      GUEST_USER_EMAIL
    )
    return false
  }

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
