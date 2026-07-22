export const GUEST_USER_EMAIL =
  process.env.GUEST_USER_EMAIL ||
  process.env.NEXT_PUBLIC_DEV_USER_EMAIL ||
  'admin@local.test'

export const GUEST_USER_PASSWORD =
  process.env.GUEST_USER_PASSWORD ||
  process.env.NEXT_PUBLIC_DEV_USER_PASSWORD ||
  'admin1234'

export const GUEST_USER_NAME = 'Filip'

export function guestLoginPath(from = '/dashboard') {
  return `/api/auth/guest?from=${encodeURIComponent(from)}`
}