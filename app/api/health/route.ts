import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { resolveDatabaseUrl } from '@/lib/db/resolve-database-url'
import { GUEST_USER_EMAIL, isDedicatedGuestEmail } from '@/lib/guest-auth'

export const dynamic = 'force-dynamic'

/**
 * Public readiness probe (no secrets). Used to diagnose prod guest-auth failures
 * without needing a session cookie.
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(resolveDatabaseUrl())
  const hasBetterAuthSecret = Boolean(process.env.BETTER_AUTH_SECRET?.trim())
  const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim() || null
  const guestEmailOk = isDedicatedGuestEmail(GUEST_USER_EMAIL)

  let database: 'ok' | 'unreachable' | 'unconfigured' = 'unconfigured'
  let databaseError: string | null = null

  if (!hasDatabaseUrl) {
    database = 'unconfigured'
  } else {
    try {
      const client = await pool.connect()
      try {
        await client.query('SELECT 1')
        database = 'ok'
      } finally {
        client.release()
      }
    } catch (error) {
      database = 'unreachable'
      databaseError = error instanceof Error ? error.message : String(error)
    }
  }

  const ok =
    database === 'ok' && hasBetterAuthSecret && guestEmailOk && Boolean(betterAuthUrl)

  return NextResponse.json(
    {
      ok,
      database,
      databaseError,
      betterAuth: {
        secretConfigured: hasBetterAuthSecret,
        urlConfigured: Boolean(betterAuthUrl),
        // Host only — never echo full secrets
        urlHost: betterAuthUrl
          ? (() => {
              try {
                return new URL(betterAuthUrl).host
              } catch {
                return 'invalid'
              }
            })()
          : null,
      },
      guest: {
        emailIsLocalTest: guestEmailOk,
      },
      vercel: {
        env: process.env.VERCEL_ENV ?? null,
        url: process.env.VERCEL_URL ?? null,
        productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
      },
    },
    { status: ok ? 200 : 503 }
  )
}
