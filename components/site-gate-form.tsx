'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, HelpCircle, ArrowRight } from 'lucide-react'

export function SiteGateForm() {
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectAfterGate = (fromParam: string | null) => {
    // Prefer dashboard2 — bare "/" used to bounce through redirects and look like a black screen.
    const raw = fromParam && fromParam !== '/' ? fromParam : '/dashboard2'
    const target =
      raw === '/dashboard' || raw.startsWith('/dashboard?') ? '/dashboard2' : raw
    // Hard navigation avoids stuck client transitions on a black #030305 shell.
    window.location.assign(target)
  }

  useEffect(() => {
    let cancelled = false
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/gate')
        if (res.ok) {
          const data = await res.json()
          if (data.authorized) {
            if (!cancelled) setAuthorized(true)
            redirectAfterGate(searchParams.get('from'))
            return
          }
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        if (!cancelled) setIsChecking(false)
      }
    }

    checkStatus()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.authorized || data.success) {
          setAuthorized(true)
          redirectAfterGate(searchParams.get('from'))
          return
        }
      } else {
        setError('Neplatné heslo')
      }
    } catch {
      setError('Chyba spojenia')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Checking / post-auth: keep visible feedback (never blank black Suspense shell)
  if (isChecking || authorized) {
    return (
      <div className="min-h-dvh bg-[#030305] flex flex-col items-center justify-center gap-3 font-sans text-white overflow-hidden">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
        <p className="text-xs text-slate-500">{authorized ? 'Presmerovávam…' : 'Overujem prístup…'}</p>
      </div>
    )
  }

  // Render unauthorized state: pulsing red question mark, click reveals password form
  return (
    <div className="min-h-dvh bg-[#030305] flex flex-col items-center justify-center font-sans text-white overflow-hidden p-4">
      <HelpCircle
        data-testid="red-question-mark"
        className="w-16 h-16 text-red-500 animate-pulse cursor-pointer hover:text-red-400 transition-colors duration-200 mb-4"
        onClick={() => setShowInput((prev) => !prev)}
      />

      {showInput && (
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs animate-in fade-in duration-200">
          <div className="relative w-full flex items-center">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Heslo"
              className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-2 p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
        </form>
      )}
    </div>
  )
}