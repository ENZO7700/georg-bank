import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { resolveDatabaseUrl } from '@/lib/db/resolve-database-url'
import {
  GUEST_USER_EMAIL,
  GUEST_USER_NAME,
  GUEST_USER_PASSWORD,
  isDedicatedGuestEmail,
  syncGuestCredentialPassword,
} from '@/lib/guest-auth'
import { NextRequest, NextResponse } from 'next/server'

function copyAuthCookies(source: Response, target: NextResponse) {
  if (typeof source.headers.getSetCookie === 'function') {
    for (const cookie of source.headers.getSetCookie()) {
      target.headers.append('Set-Cookie', cookie)
    }
    return
  }

  const setCookie = source.headers.get('set-cookie')
  if (setCookie) {
    target.headers.set('set-cookie', setCookie)
  }
}

/**
 * Better Auth dynamic baseURL needs host / x-forwarded-* from the real request.
 * Stripping to cookie+origin alone breaks resolution on Vercel aliases.
 */
function serverAuthHeaders(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('origin', request.nextUrl.origin)
  headers.set('content-type', 'application/json')
  if (!headers.get('host')) {
    headers.set('host', request.nextUrl.host)
  }
  return headers
}

async function probeDatabase(): Promise<{ ok: boolean; detail: string }> {
  const resolved = resolveDatabaseUrl()
  if (!resolved) {
    return {
      ok: false,
      detail: 'No DATABASE_URL / SUPABASE_* connection configured',
    }
  }
  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
    } finally {
      client.release()
    }
    return { ok: true, detail: 'ok' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, detail: message }
  }
}

function guestFailureHtml(hint: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Prihlásenie</title>
<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#030305;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;text-align:center}
a{color:#60a5fa}code{font-size:12px;color:#94a3b8}</style></head><body><div><p>Nepodarilo sa automaticky prihlásiť.</p>
<p style="color:#94a3b8;font-size:14px">Skontrolujte DATABASE_URL a BETTER_AUTH_* na Vercel.</p>
<p><code>${hint.replace(/</g, '&lt;').slice(0, 180)}</code></p>
<p><a href="/sign-in">Prihlásiť sa manuálne</a> · <a href="/gate">Späť na bránu</a></p></div></body></html>`
}

async function ensureGuestSignedIn(request: NextRequest) {
  if (!isDedicatedGuestEmail(GUEST_USER_EMAIL)) {
    console.error(
      '[guest-auth] Refusing guest login: GUEST_USER_EMAIL must end with @local.test, got:',
      GUEST_USER_EMAIL
    )
    return new Response(JSON.stringify({ error: 'Guest auth misconfigured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  const dbProbe = await probeDatabase()
  if (!dbProbe.ok) {
    console.error('[guest-auth] database unreachable:', dbProbe.detail)
    return new Response(
      JSON.stringify({ error: 'Database unreachable', detail: dbProbe.detail }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }

  const headers = serverAuthHeaders(request)
  const credentials = {
    email: GUEST_USER_EMAIL,
    password: GUEST_USER_PASSWORD,
  }

  let response = await auth.api.signInEmail({
    body: credentials,
    headers,
    asResponse: true,
  })

  if (response.ok) return response

  const { ensureDatabase } = await import('@/scripts/ensure-db')
  await ensureDatabase().catch((error) => {
    console.error('[guest-auth] ensureDatabase failed:', error)
  })

  const signUpResponse = await auth.api.signUpEmail({
    body: {
      ...credentials,
      name: GUEST_USER_NAME,
    },
    headers,
    asResponse: true,
  })

  // Existing guest with a different password → sign-up 422, sign-in keeps failing.
  // Sync the credential hash to the configured guest password, then retry.
  if (!signUpResponse.ok) {
    const synced = await syncGuestCredentialPassword().catch((error) => {
      console.error('[guest-auth] password sync failed:', error)
      return false
    })
    if (synced) {
      console.warn('[guest-auth] synced guest credential password')
    }
  }

  response = await auth.api.signInEmail({
    body: credentials,
    headers,
    asResponse: true,
  })

  return response
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') ?? '/dashboard2'

  try {
    const authResponse = await ensureGuestSignedIn(request)

    if (!authResponse.ok) {
      const body = await authResponse.text().catch(() => '')
      console.error('[guest-auth] sign-in failed:', authResponse.status, body)
      const hint =
        (() => {
          try {
            const parsed = JSON.parse(body) as { detail?: string; error?: string }
            return parsed.detail || parsed.error || `HTTP ${authResponse.status}`
          } catch {
            return body.slice(0, 120) || `HTTP ${authResponse.status}`
          }
        })()
      // GET guest is always a browser navigation → never return blank JSON.
      const accept = request.headers.get('accept') || ''
      if (accept.includes('text/html') || accept.includes('*/*') || !accept) {
        return new NextResponse(guestFailureHtml(hint), {
          status: 500,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })
      }
      return NextResponse.json(
        { error: 'Nepodarilo sa automaticky prihlásiť.', detail: hint },
        { status: 500 }
      )
    }

    const redirectUrl = new URL(from, request.url)
    const response = NextResponse.redirect(redirectUrl)
    copyAuthCookies(authResponse, response)
    return response
  } catch (error) {
    console.error('[guest-auth] unexpected error:', error)
    const hint = error instanceof Error ? error.message : 'unexpected'
    const accept = request.headers.get('accept') || ''
    if (accept.includes('text/html') || accept.includes('*/*') || !accept) {
      return new NextResponse(guestFailureHtml(hint), {
        status: 500,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
    return NextResponse.json(
      { error: 'Nepodarilo sa automaticky prihlásiť.', detail: hint },
      { status: 500 }
    )
  }
}
