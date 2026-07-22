import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface SyncOperation {
  id: string
  action: string
  payload: unknown
  status: 'pending' | 'failed'
  createdAt: number
  retries: number
}

interface GeorgeDBSchema extends DBSchema {
  data_cache: {
    key: string
    value: { id: string; data: unknown; updatedAt: number }
  }
  sync_queue: {
    key: string
    value: SyncOperation
    indexes: { 'by-status': string }
  }
}

let dbPromise: Promise<IDBPDatabase<GeorgeDBSchema>> | null = null

export function getDB() {
  if (typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB<GeorgeDBSchema>('george-offline-db', 1, {
      upgrade(db: IDBPDatabase<GeorgeDBSchema>) {
        if (!db.objectStoreNames.contains('data_cache')) {
          db.createObjectStore('data_cache', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' })
          syncStore.createIndex('by-status', 'status')
        }
      },
    })
  }
  return dbPromise
}

export async function addSyncOperation(operation: Omit<SyncOperation, 'status' | 'retries' | 'createdAt'>) {
  const db = await getDB()
  if (!db) return

  const tx = db.transaction('sync_queue', 'readwrite')
  await tx.store.add({
    ...operation,
    status: 'pending',
    retries: 0,
    createdAt: Date.now(),
  })
  await tx.done

  // Registrujeme background sync, ak to prehliadač podporuje
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      // @ts-expect-error - Background Sync API nemusí byť v štandardných typoch
      await registration.sync.register('george-sync')
    } catch (e) {
      console.error('Background Sync registration failed', e)
    }
  }
}

export async function getPendingOperations() {
  const db = await getDB()
  if (!db) return []
  return db.getAllFromIndex('sync_queue', 'by-status', 'pending')
}

export async function removeSyncOperation(id: string) {
  const db = await getDB()
  if (!db) return
  await db.delete('sync_queue', id)
}

export async function updateSyncOperation(id: string, updates: Partial<SyncOperation>) {
  const db = await getDB()
  if (!db) return
  const tx = db.transaction('sync_queue', 'readwrite')
  const item = await tx.store.get(id)
  if (item) {
    await tx.store.put({ ...item, ...updates })
  }
  await tx.done
}
