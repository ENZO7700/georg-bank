import { sk, Dictionary } from './dictionaries/sk'
import { en } from './dictionaries/en'

export type Locale = 'sk' | 'en'

const dictionaries = {
  sk,
  en,
}

export const defaultLocale: Locale = 'sk'

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale]
}
