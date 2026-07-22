'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { Dictionary } from '@/lib/dictionaries/sk'

type TranslationContextType = {
  dictionary: Dictionary
  locale: string
}

const TranslationContext = createContext<TranslationContextType | null>(null)

export function TranslationProvider({ 
  children, 
  dictionary,
  locale
}: { 
  children: ReactNode
  dictionary: Dictionary
  locale: string
}) {
  return (
    <TranslationContext.Provider value={{ dictionary, locale }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context.dictionary
}

export function useLocale() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useLocale must be used within a TranslationProvider')
  }
  return context.locale
}
