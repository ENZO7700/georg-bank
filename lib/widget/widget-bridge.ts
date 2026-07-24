'use client'

import { registerPlugin, Capacitor, WebPlugin } from '@capacitor/core'
import { buildWidgetSnapshotFromTransactionsApi, type TransactionsApiPayload } from '@/lib/widget/build-snapshot'
import type { WidgetSnapshot } from '@/lib/widget/types'

export type WidgetBridgePlugin = {
  writeSnapshot(options: { snapshot: WidgetSnapshot } | WidgetSnapshot): Promise<void>
  readSnapshot(): Promise<{ snapshot: WidgetSnapshot | null }>
  reloadAllTimelines(): Promise<void>
}

class WidgetBridgeWeb extends WebPlugin implements WidgetBridgePlugin {
  async writeSnapshot(): Promise<void> {
    /* no-op on pure web / PWA */
  }

  async readSnapshot(): Promise<{ snapshot: WidgetSnapshot | null }> {
    return { snapshot: null }
  }

  async reloadAllTimelines(): Promise<void> {
    /* no-op */
  }
}

const WidgetBridgeNative = registerPlugin<WidgetBridgePlugin>('WidgetBridge', {
  web: () => new WidgetBridgeWeb(),
})

function isNativeCapacitor(): boolean {
  try {
    return typeof window !== 'undefined' && Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Persist snapshot into App Group + reload WidgetKit timelines.
 * Safe no-op on web / when the native plugin is missing.
 */
export async function writeWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  if (!isNativeCapacitor()) return
  try {
    await WidgetBridgeNative.writeSnapshot({ snapshot })
    await WidgetBridgeNative.reloadAllTimelines()
  } catch (err) {
    console.warn('[widget] writeSnapshot failed:', err)
  }
}

export async function readWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  if (!isNativeCapacitor()) return null
  try {
    const result = await WidgetBridgeNative.readSnapshot()
    return result?.snapshot ?? null
  } catch (err) {
    console.warn('[widget] readSnapshot failed:', err)
    return null
  }
}

/** Build + write snapshot after a successful /api/transactions response. */
export async function syncWidgetFromTransactionsApi(
  payload: TransactionsApiPayload
): Promise<void> {
  if (!isNativeCapacitor()) return
  const snapshot = buildWidgetSnapshotFromTransactionsApi(payload)
  await writeWidgetSnapshot(snapshot)
}

export { WidgetBridgeNative as WidgetBridge }
