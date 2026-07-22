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
    pathname.startsWith('/api/transactions')
  )
}

/**
 * Next.js 16+: file convention is `proxy` (formerly `middleware`).
 * Site gate + guest session redirects.
 */
export function proxy(request: NextRequest) {
  if (isSiteGateEnabled()) {
    const hasGateCookie = request.cookies.get(SITE_GATE_COOKIE)?.value === SITE_GATE_TOKEN
    const isTS = isTailscaleRequest(request)

    if (hasGateCookie || isTS) {
      return NextResponse.next()
    }

    const { pathname, search } = request.nextUrl

    if (pathname === '/gate' || pathname.startsWith('/api/gate')) {
      return NextResponse.next()
    }

    const gateUrl = request.nextUrl.clone()
    gateUrl.pathname = '/gate'
    gateUrl.search = ''
    const redirectTarget = `${pathname}${search}`
    if (redirectTarget !== '/') {
      gateUrl.searchParams.set('from', redirectTarget)
    }

    return NextResponse.redirect(gateUrl)
  }

  if (hasSessionCookie(request) || shouldSkipAuth(request)) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl
  const guestUrl = request.nextUrl.clone()
  guestUrl.pathname = '/api/auth/guest'
  guestUrl.search = ''
  const target = pathname === '/' ? '/dashboard2' : `${pathname}${search}`
  guestUrl.searchParams.set('from', target)

  return NextResponse.redirect(guestUrl)
}

export const config = {
  matcher: [
    // Skip static assets + face-api weights under /models (public/)
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|service-worker.js|models/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|json)$).*)',
  ],
}
