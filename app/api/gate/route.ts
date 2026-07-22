import { NextRequest, NextResponse } from 'next/server'
import { getSiteGatePassword, SITE_GATE_COOKIE, SITE_GATE_TOKEN, isTailscaleRequest } from '@/lib/site-gate'

export async function GET(request: NextRequest) {
  const hasGateCookie = request.cookies.get(SITE_GATE_COOKIE)?.value === SITE_GATE_TOKEN
  const isTS = isTailscaleRequest(request)

  if (hasGateCookie || isTS) {
    return NextResponse.json({ authorized: true, viaTailscale: isTS })
  }

  return NextResponse.json({ authorized: false })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const password = body.password || body.heslo

    if (password === getSiteGatePassword()) {
      const response = NextResponse.json({ success: true, authorized: true })
      response.cookies.set(SITE_GATE_COOKIE, SITE_GATE_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      return response
    }

    return NextResponse.json(
      { error: 'Neplatné heslo' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Chyba požiadavky' },
      { status: 400 }
    )
  }
}