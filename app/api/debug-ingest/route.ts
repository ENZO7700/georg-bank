import { appendFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

const LOG_PATH = path.join(process.cwd(), '.cursor', 'debug-9365c0.log')

/** Same-origin debug ingest for Capacitor WKWebView (avoids cross-origin Load failed). */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const line = JSON.stringify({
      sessionId: '9365c0',
      ...body,
      timestamp: body?.timestamp ?? Date.now(),
    })
    await mkdir(path.dirname(LOG_PATH), { recursive: true })
    await appendFile(LOG_PATH, `${line}\n`, 'utf8')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'write failed' },
      { status: 500 }
    )
  }
}
