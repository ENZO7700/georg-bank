import { NextResponse } from 'next/server'
import { generateBulkStatementsAction, type BulkStatementRequest } from '@/app/actions/statements'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BulkStatementRequest
    const statements = await generateBulkStatementsAction(body)
    return NextResponse.json({ statements })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const status = message === 'Unauthorized' ? 401 : message.includes('Limit') ? 429 : 400
    return NextResponse.json({ error: message }, { status })
  }
}