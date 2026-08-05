export type {
  WidgetSnapshot,
  WidgetLastPayment,
  WidgetGender,
  WidgetGreetingStyle,
  WidgetTheme,
} from '@/lib/widget/types'
export {
  WIDGET_SNAPSHOT_KEY,
  WIDGET_APP_GROUP,
  DEFAULT_WIDGET_SETTINGS,
  DEFAULT_WIDGET_DEEP_LINKS,
} from '@/lib/widget/types'
export {
  buildWidgetSnapshotFromTransactionsApi,
  type TransactionsApiPayload,
} from '@/lib/widget/build-snapshot'
export {
  syncWidgetFromTransactionsApi,
  writeWidgetSnapshot,
  readWidgetSnapshot,
  WidgetBridge,
} from '@/lib/widget/widget-bridge'
