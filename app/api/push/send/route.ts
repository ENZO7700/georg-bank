import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushSubscription } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim()
const vapidConfigured = Boolean(vapidPublic && vapidPrivate)

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@internetbank.sk',
    vapidPublic!,
    vapidPrivate!
  )
}

/** Soft-skip when push is off / misconfigured — never 500 the dashboard. */
function skip(reason: string) {
  console.warn('[Push API] Skipping send:', reason)
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: Request) {
  try {
    if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'false') {
      return skip('PUSH_NOTIFICATIONS_ENABLED=false')
    }

    if (!vapidConfigured) {
      return skip('VAPID keys not configured')
    }

    const body = await req.json().catch(() => ({}))
    const {
      title = 'VELKÝ BRAT ŤA SLEDUJE !',
      message = 'Zmeny v odchádzajúcich platbách boli úspešne aplikované.',
      userId,
    } = body ?? {}

    const payload = JSON.stringify({
      title,
      body: message,
      url: '/dashboard',
      timestamp: Date.now(),
    })

    console.log('[Push API] Sending broadcast/push notification:', title)

    let subs: (typeof pushSubscription.$inferSelect)[] = []
    try {
      if (userId) {
        subs = await db.select().from(pushSubscription).where(eq(pushSubscription.userId, userId))
      } else {
        subs = await db.select().from(pushSubscription)
      }
    } catch (dbErr) {
      console.warn('[Push API] Subscription lookup failed (no DB):', dbErr)
      return skip('subscription store unavailable')
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
    console.warn('[Push API] Soft-fail (no 500):', errMsg)
    return skip(errMsg)
  }
}
