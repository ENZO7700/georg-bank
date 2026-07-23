import { Suspense } from 'react'
import { SiteGateForm } from '@/components/site-gate-form'

export const metadata = {
  title: 'Not Found',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function GatePage() {
  return (
    <Suspense fallback={null}>
      <SiteGateForm />
    </Suspense>
  )
}