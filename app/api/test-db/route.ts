import { NextResponse } from 'next/server'
import { db, pool } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = await pool.connect()
    client.release()
    
    const res = await db.execute(sql`SELECT 1 as success`);
    return NextResponse.json({ success: true, dbResponse: res });
  } catch (err) {
    const error = err as Error & { code?: string };
    return NextResponse.json({ success: false, error: error.message, stack: error.stack, code: error.code }, { status: 500 });
  }
}
