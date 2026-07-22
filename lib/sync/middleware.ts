/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateCreator, StoreMutatorIdentifier } from 'zustand'
import { addSyncOperation } from './db'

type SyncMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

type SyncMiddlewareImpl = <T>(
  f: StateCreator<T, [], []>
) => StateCreator<T, [], []>

const syncMiddlewareImpl: SyncMiddlewareImpl = (f) => (set: any, get: any, api: any) => {
  const patchedSet = (args: any, replace: any) => {
    // Normal zustand set
    set(args, replace)
    
    // We can intercept specific changes if we want, but for now we expose 
    // a helper on the store to manually dispatch sync actions.
  }

  return f(patchedSet, get, api)
}

export const syncMiddleware = syncMiddlewareImpl as unknown as SyncMiddleware

// Pomocná funkcia pre odoslanie akcie do fronty a optimistický update
export async function dispatchOfflineAction(
  actionType: string,
  payload: unknown,
  optimisticUpdate: () => void
) {
  // 1. Aplikuj zmenu v UI ihneď (Optimistic update)
  optimisticUpdate()

  // 2. Skús spraviť reálny network request (ak sme online)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      // Skutočný request pôjde priamo z aplikácie (napr. cez fetch/drizzle)
      // Tento middleware je tu hlavne pre záchranu, ak by fetch zlyhal
      return
    } catch (e) {
      console.warn('Network request failed, queueing for offline sync', e)
    }
  }

  // 3. Ulož do IndexedDB pre neskorší background sync
  await addSyncOperation({
    id: `${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action: actionType,
    payload,
  })
}
