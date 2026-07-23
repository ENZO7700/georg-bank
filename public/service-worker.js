// George PWA Service Worker v3
const CACHE_VERSION = 'george-pwa-v3'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`

// Static assets to pre-cache (shell of the app).
// Only include URLs that exist under public/ — a single miss used to
// fail cache.addAll and prevent the SW from ever activating.
const PRECACHE_URLS = [
  '/offline.html',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/icon.svg',
  '/favicon.ico',
]

/** Precache each URL individually so one miss does not abort install. */
async function precacheAssets(cache) {
  const results = await Promise.allSettled(
    PRECACHE_URLS.map((url) => cache.add(url))
  )
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn('[SW] Precache miss (non-fatal):', PRECACHE_URLS[index], result.reason)
    }
  })
}

// Install: pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets')
        return precacheAssets(cache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests (POST for auth/transfers etc.)
  if (request.method !== 'GET') return

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return

  // Skip Next.js internals & HMR in development
  if (url.pathname.startsWith('/_next/') || url.pathname.includes('__nextjs')) return

  // Skip API routes — always go to network
  if (url.pathname.startsWith('/api/')) return

  // Strategy for static assets (images, fonts, icons)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Strategy for navigation requests (HTML pages) — network first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  // Everything else — network first with cache fallback
  event.respondWith(networkFirst(request))
})

// --- Caching strategies ---

// Cache-first: for static assets that rarely change
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503, statusText: 'Service Unavailable' })
  }
}

// Network-first for navigation: try network, show offline page if fails
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Try to serve cached version of the page
    const cached = await caches.match(request)
    if (cached) return cached

    // Last resort — serve offline fallback page
    const offlinePage = await caches.match('/offline.html')
    return offlinePage || new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

// Network-first: for dynamic content
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('', { status: 503, statusText: 'Service Unavailable' })
  }
}

// --- Helpers ---

function isStaticAsset(pathname) {
  return /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i.test(pathname)
}

// --- Push Notifications ---

self.addEventListener('push', (event) => {
  let data = { title: 'George', body: 'Máte novú notifikáciu' }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: data.tag || 'george-notification',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click: open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if found
      for (const client of clientList) {
        if (new URL(client.url).pathname === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      return clients.openWindow(targetUrl)
    })
  )
})

// --- Background Sync API ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'george-sync') {
    event.waitUntil(processSyncQueue())
  }
})

async function processSyncQueue() {
  console.log('[SW] Processing background sync queue')
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('george-offline-db')
    request.onsuccess = async (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('sync_queue')) return resolve(null)
      
      const tx = db.transaction('sync_queue', 'readonly')
      const store = tx.objectStore('sync_queue')
      const index = store.index('by-status')
      const getReq = index.getAll('pending')
      
      getReq.onsuccess = async () => {
        const items = getReq.result
        if (!items || items.length === 0) return resolve(null)
        
        console.log(`[SW] Found ${items.length} pending operations. Syncing...`)
        
        try {
          // Send to /api/sync
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operations: items })
          })
          
          if (response.ok) {
            console.log('[SW] Sync successful')
            self.registration.showNotification('George', {
              body: 'Tvoje offline zmeny boli úspešne synchronizované.',
              icon: '/android-chrome-192x192.png'
            })
            resolve(true)
          } else {
            throw new Error('Sync failed')
          }
        } catch (err) {
          console.error('[SW] Sync error', err)
          reject(err)
        }
      }
    }
    request.onerror = () => reject(request.error)
  })
}

