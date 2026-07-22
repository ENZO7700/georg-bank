'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, HelpCircle, ArrowRight } from 'lucide-react'

export function SiteGateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/gate')
        if (res.ok) {
          const data = await res.json()
          if (data.authorized) {
            setAuthorized(true)
            
            // Auto redirect instantly
            const from = searchParams.get('from') || '/'
            router.push(from)
            router.refresh()
            return
          }
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkStatus()
  }, [router, searchParams])

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
          const from = searchParams.get('from') || '/'
          router.push(from)
          router.refresh()
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

  // Render checking state: completely silent and generic
  if (isChecking || authorized) {
    return (
      <div className="min-h-dvh bg-[#030305] flex items-center justify-center font-sans text-white overflow-hidden">
        <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
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