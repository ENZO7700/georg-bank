import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushSubscription } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@internetbank.sk',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title = 'VELKÝ BRAT ŤA SLEDUJE !', message = 'Zmeny v odchádzajúcich platbách boli úspešne aplikované.', userId } = body

    const payload = JSON.stringify({
      title,
      body: message,
      url: '/dashboard',
      timestamp: Date.now(),
    })

    console.log('[Push API] Sending broadcast/push notification:', title)

    // Fetch subscriptions
    let subs = []
    if (userId) {
      subs = await db.select().from(pushSubscription).where(eq(pushSubscription.userId, userId))
    } else {
      subs = await db.select().from(pushSubscription)
    }

    let sentCount = 0
    let failedCount = 0

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
        sentCount++
      } catch (err) {
        console.error('[Push API] Error sending push to endpoint:', sub.endpoint, err)
        failedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Push notification sent. Delivered: ${sentCount}, Failed/Expired: ${failedCount}`,
      sentCount,
      failedCount,
      totalSubscriptions: subs.length,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Push API] Error:', error)
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
  }
}
