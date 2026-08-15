import { auth } from '@/lib/auth'
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

function serverAuthHeaders(request: NextRequest) {
  const headers = new Headers()
  const cookie = request.headers.get('cookie')
  if (cookie) headers.set('cookie', cookie)

  const origin = request.nextUrl.origin
  headers.set('origin', origin)
  headers.set('content-type', 'application/json')
  return headers
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
  await ensureDatabase().catch(() => undefined)

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
      // GET guest is always a browser navigation → never return blank JSON.
      const accept = request.headers.get('accept') || ''
      if (accept.includes('text/html') || accept.includes('*/*') || !accept) {
        const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Prihlásenie</title>
<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#030305;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;text-align:center}
a{color:#60a5fa}</style></head><body><div><p>Nepodarilo sa automaticky prihlásiť.</p>
<p style="color:#94a3b8;font-size:14px">Skontrolujte DATABASE_URL a BETTER_AUTH_* na Vercel.</p>
<p><a href="/sign-in">Prihlásiť sa manuálne</a> · <a href="/gate">Späť na bránu</a></p></div></body></html>`
        return new NextResponse(html, {
          status: 500,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })
      }
      return NextResponse.json(
        { error: 'Nepodarilo sa automaticky prihlásiť.' },
        { status: 500 }
      )
    }

    const redirectUrl = new URL(from, request.url)
    const response = NextResponse.redirect(redirectUrl)
    copyAuthCookies(authResponse, response)
    return response
  } catch (error) {
    console.error('[guest-auth] unexpected error:', error)
    const accept = request.headers.get('accept') || ''
    if (accept.includes('text/html') || accept.includes('*/*') || !accept) {
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Prihlásenie</title>
<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#030305;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;text-align:center}
a{color:#60a5fa}</style></head><body><div><p>Nepodarilo sa automaticky prihlásiť.</p>
<p style="color:#94a3b8;font-size:14px">Databáza alebo auth nie sú dostupné. Skús znova neskôr.</p>
<p><a href="/sign-in">Prihlásiť sa manuálne</a> · <a href="/dashboard2">Skúsiť dashboard</a></p></div></body></html>`
      return new NextResponse(html, {
        status: 500,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
    return NextResponse.json(
      { error: 'Nepodarilo sa automaticky prihlásiť.' },
      { status: 500 }
    )
  }
}