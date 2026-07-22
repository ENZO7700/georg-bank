'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from './providers/translation-provider'

export function LanguageSwitcher() {
  const router = useRouter()
  const currentLocale = useLocale()

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleLanguageChange('sk')}
        className={`w-8 h-6 rounded overflow-hidden border border-gray-200 transition-transform ${
          currentLocale === 'sk' ? 'ring-2 ring-[#004e92] scale-110' : 'opacity-60 hover:opacity-100'
        }`}
        title="Slovenčina"
        aria-label="Prepnúť na Slovenčinu"
      >
        <svg viewBox="0 0 60 40" className="w-full h-full object-cover">
          <rect width="60" height="40" fill="#ffffff" />
          <rect width="60" height="13.3" y="0" fill="#ffffff" />
          <rect width="60" height="13.3" y="13.3" fill="#0b4ea2" />
          <rect width="60" height="13.4" y="26.6" fill="#ee1c25" />
          <g transform="translate(18, 20) scale(0.6)">
            <path d="M-10,-6 L-10,4 Q-10,14 0,20 Q10,14 10,4 L10,-6 L0,-10 Z" fill="#ee1c25" stroke="#ffffff" strokeWidth="1" />
            <path d="M-5,10 L5,10 M0,2 L0,18" stroke="#ffffff" strokeWidth="3" />
            <path d="M0,6 L-3,-2 L3,-2 Z" fill="#ffffff" />
          </g>
        </svg>
      </button>

      <button
        onClick={() => handleLanguageChange('en')}
        className={`w-8 h-6 rounded overflow-hidden border border-gray-200 transition-transform bg-white ${
          currentLocale === 'en' ? 'ring-2 ring-[#004e92] scale-110' : 'opacity-60 hover:opacity-100'
        }`}
        title="English"
        aria-label="Switch to English"
      >
        <svg viewBox="0 0 60 40" className="w-full h-full object-cover">
          <path d="M30,0 V40 M0,20 H60" stroke="#cf142b" strokeWidth="6" />
        </svg>
      </button>
    </div>
  )
}
