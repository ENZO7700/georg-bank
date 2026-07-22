import { NextResponse } from 'next/server'
import { strFromU8, unzlibSync } from 'fflate'

export async function POST(req: Request) {
  try {
    // Optional: Podpora pre komprimované payloady
    let body
    const contentType = req.headers.get('Content-Type')
    
    if (contentType === 'application/octet-stream') {
      const buffer = await req.arrayBuffer()
      const decompressed = unzlibSync(new Uint8Array(buffer))
      body = JSON.parse(strFromU8(decompressed))
    } else {
      body = await req.json()
    }

    const { operations } = body

    if (!Array.isArray(operations)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Tu sa deje skutočný Conflict Resolution a spracovanie batch požiadaviek
    const results = operations.map((op: { id: string; action: string; payload: unknown; createdAt: number }) => {
      console.log('Processing offline operation:', op.action, op.payload)
      
      // Konfliktná logika: Last-Write-Wins na základe op.createdAt vs DB.updatedAt
      // Pre demonštráciu len vraciame success
      return { id: op.id, status: 'success' }
    })

    return NextResponse.json({ success: true, processed: results.length, results })
  } catch (error) {
    console.error('Sync Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
