import { Suspense } from 'react'
import { SiteGateForm } from '@/components/site-gate-form'

export const metadata = {
  title: 'George – vstup',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

function GateFallback() {
  return (
    <div className="min-h-dvh bg-[#030305] flex items-center justify-center text-slate-400 text-sm">
      Načítavam…
    </div>
  )
}

export default function GatePage() {
  return (
    <Suspense fallback={<GateFallback />}>
      <SiteGateForm />
    </Suspense>
  )
}