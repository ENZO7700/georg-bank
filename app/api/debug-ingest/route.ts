import { appendFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

const LOG_PATH = path.join(process.cwd(), '.cursor', 'debug-9365c0.log')

/**
 * Same-origin debug ingest for Capacitor WKWebView (avoids cross-origin Load failed).
 * Optional telemetry only — never fail the request (Vercel FS is read-only).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    // Serverless/production has a read-only filesystem; persist only in local/dev.
    if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
      const line = JSON.stringify({
        sessionId: '9365c0',
        ...body,
        timestamp: body?.timestamp ?? Date.now(),
      })
      await mkdir(path.dirname(LOG_PATH), { recursive: true })
      await appendFile(LOG_PATH, `${line}\n`, 'utf8')
    }
  } catch {
    // Swallow write/parse errors — debug ingest must not spam 500s.
  }
  return new NextResponse(null, { status: 204 })
}
