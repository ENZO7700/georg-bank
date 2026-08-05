/** Cross-tab / same-origin live bus for /pohyby dashboard. */

export const POHYBY_LIVE_CHANNEL = 'pohyby-live-v1'
export const POHYBY_LIVE_STORAGE_KEY = 'pohyby-live-ping'

export type PohybyLiveEvent = {
  type: 'payment' | 'refresh'
  at: number
  transactionId?: string
}

export function notifyPohybyLive(event: Omit<PohybyLiveEvent, 'at'> & { at?: number }) {
  if (typeof window === 'undefined') return
  const payload: PohybyLiveEvent = {
    type: event.type,
    at: event.at ?? Date.now(),
    transactionId: event.transactionId,
  }
  try {
    const bc = new BroadcastChannel(POHYBY_LIVE_CHANNEL)
    bc.postMessage(payload)
    bc.close()
  } catch {
    // BroadcastChannel unsupported — fall through to storage
  }
  try {
    localStorage.setItem(POHYBY_LIVE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

export function subscribePohybyLive(onEvent: (event: PohybyLiveEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  let bc: BroadcastChannel | null = null
  const onMessage = (ev: MessageEvent) => {
    if (ev?.data && typeof ev.data === 'object' && ev.data.type) {
      onEvent(ev.data as PohybyLiveEvent)
    }
  }
  try {
    bc = new BroadcastChannel(POHYBY_LIVE_CHANNEL)
    bc.addEventListener('message', onMessage)
  } catch {
    bc = null
  }

  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== POHYBY_LIVE_STORAGE_KEY || !ev.newValue) return
    try {
      const data = JSON.parse(ev.newValue) as PohybyLiveEvent
      if (data?.type) onEvent(data)
    } catch {
      // ignore
    }
  }
  window.addEventListener('storage', onStorage)

  return () => {
    bc?.removeEventListener('message', onMessage)
    bc?.close()
    window.removeEventListener('storage', onStorage)
  }
}
