import { PohybyClient } from '@/components/pohyby-client'

export const metadata = {
  title: 'Pohyby – live dashboard',
  description: 'Živý prehľad platieb a denného limitu',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function PohybyPage() {
  return <PohybyClient />
}
