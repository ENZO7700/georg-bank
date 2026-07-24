/** Shared WidgetSnapshot v1 — keep in sync with ios/App/Shared/WidgetSnapshot.swift */

export type WidgetGender = 'female' | 'male' | 'unspecified'
export type WidgetGreetingStyle = 'formal' | 'informal'
export type WidgetTheme = 'dark' | 'light' | 'system'

export type WidgetLastPayment = {
  id: string
  /** Negative for outgoing payments (cents). */
  amountCents: number
  label: string
  createdAt: string
}

export type WidgetSnapshot = {
  version: 1
  updatedAt: string
  profile: {
    displayName: string
    gender: WidgetGender
    greetingStyle: WidgetGreetingStyle
  }
  money: {
    currency: 'EUR'
    balanceCents: number
    lastPayment?: WidgetLastPayment
  }
  dailyLimit: {
    limitCents: number
    usedCents: number
    remainingCents: number
    windowEndsAt: string
  }
  settings: {
    notificationsEnabled: boolean
    notifyOnPayment: boolean
    notifyOnLimit80: boolean
    notifyOnLimit100: boolean
    widgetTheme: WidgetTheme
    showBalance: boolean
    showLastPayment: boolean
    showDailyLimit: boolean
    compactMode: boolean
  }
  deepLink: {
    openPohyby: string
    openDashboard: string
    openSettings: string
  }
}

export const WIDGET_SNAPSHOT_KEY = 'widget.snapshot.v1'
export const WIDGET_APP_GROUP = 'group.com.george.pwa'

export const DEFAULT_WIDGET_SETTINGS: WidgetSnapshot['settings'] = {
  notificationsEnabled: false,
  notifyOnPayment: true,
  notifyOnLimit80: true,
  notifyOnLimit100: true,
  widgetTheme: 'dark',
  showBalance: true,
  showLastPayment: true,
  showDailyLimit: true,
  compactMode: false,
}

export const DEFAULT_WIDGET_DEEP_LINKS: WidgetSnapshot['deepLink'] = {
  openPohyby: 'george://pohyby',
  openDashboard: 'george://dashboard2',
  openSettings: 'george://settings/widget',
}
