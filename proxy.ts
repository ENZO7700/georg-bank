import { NextRequest, NextResponse } from 'next/server'
import { isSiteGateEnabled, SITE_GATE_COOKIE, SITE_GATE_TOKEN, isTailscaleRequest } from '@/lib/site-gate'

const SESSION_COOKIE = '__Secure-better-auth.session_token'
const SESSION_COOKIE_INSECURE = 'better-auth.session_token'

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(SESSION_COOKIE_INSECURE)?.value
  )
}

function shouldSkipAuth(request: NextRequest) {
  const { pathname } = request.nextUrl
  return (
    pathname.startsWith('/api/auth') ||
    pathname === '/gate' ||
    pathname.startsWith('/api/gate') ||
    pathname.startsWith('/api/transactions') ||
    pathname.startsWith('/api/push') ||
    pathname.startsWith('/api/debug-ingest')
  )
}

/**
 * Next.js 16+: file convention is `proxy` (formerly `middleware`).
 * Site gate + guest session redirects.
 * Legacy /dashboard is redirected to /dashboard2 (active product surface).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Prefer dashboard2 — block opening the legacy /dashboard shell.
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard2'
    url.search = search
    return NextResponse.redirect(url)
  }

  if (isSiteGateEnabled()) {
    const hasGateCookie = request.cookies.get(SITE_GATE_COOKIE)?.value === SITE_GATE_TOKEN
    const isTS = isTailscaleRequest(request)

    if (hasGateCookie || isTS) {
      return NextResponse.next()
    }

    if (pathname === '/gate' || pathname.startsWith('/api/gate')) {
      return NextResponse.next()
    }

    const gateUrl = request.nextUrl.clone()
    gateUrl.pathname = '/gate'
    gateUrl.search = ''
    const redirectTarget = `${pathname}${search}`
    if (redirectTarget !== '/') {
      // Normalize legacy landing to dashboard2 when bouncing via gate
      const from =
        redirectTarget === '/dashboard' || redirectTarget.startsWith('/dashboard?')
          ? '/dashboard2'
          : redirectTarget
      gateUrl.searchParams.set('from', from)
    }

    return NextResponse.redirect(gateUrl)
  }

  if (hasSessionCookie(request) || shouldSkipAuth(request)) {
    return NextResponse.next()
  }

  const guestUrl = request.nextUrl.clone()
  guestUrl.pathname = '/api/auth/guest'
  guestUrl.search = ''
  const rawTarget = pathname === '/' ? '/dashboard2' : `${pathname}${search}`
  const target =
    rawTarget === '/dashboard' || rawTarget.startsWith('/dashboard?')
      ? '/dashboard2'
      : rawTarget
  guestUrl.searchParams.set('from', target)

  return NextResponse.redirect(guestUrl)
}

export const config = {
  matcher: [
    // Skip static assets + face-api weights under /models (public/)
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|service-worker.js|models/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|json)$).*)',
  ],
}
