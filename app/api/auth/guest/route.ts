import { auth } from '@/lib/auth'
import {
  GUEST_USER_EMAIL,
  GUEST_USER_NAME,
  GUEST_USER_PASSWORD,
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
  const headers = serverAuthHeaders(request)

  let response = await auth.api.signInEmail({
    body: {
      email: GUEST_USER_EMAIL,
      password: GUEST_USER_PASSWORD,
    },
    headers,
    asResponse: true,
  })

  if (!response.ok) {
    const { ensureDatabase } = await import('@/scripts/ensure-db')
    await ensureDatabase().catch(() => undefined)

    await auth.api.signUpEmail({
      body: {
        email: GUEST_USER_EMAIL,
        password: GUEST_USER_PASSWORD,
        name: GUEST_USER_NAME,
      },
      headers,
      asResponse: true,
    })

    response = await auth.api.signInEmail({
      body: {
        email: GUEST_USER_EMAIL,
        password: GUEST_USER_PASSWORD,
      },
      headers,
      asResponse: true,
    })
  }

  return response
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') ?? '/dashboard2'

  try {
    const authResponse = await ensureGuestSignedIn(request)

    if (!authResponse.ok) {
      const body = await authResponse.text().catch(() => '')
      console.error('[guest-auth] sign-in failed:', authResponse.status, body)
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
    return NextResponse.json(
      { error: 'Nepodarilo sa automaticky prihlásiť.' },
      { status: 500 }
    )
  }
}