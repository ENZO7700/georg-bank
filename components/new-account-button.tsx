'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBankAccount } from '@/app/actions/banking'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function NewAccountButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreateAccount = async (type: 'checking' | 'savings') => {
    setLoading(true)
    try {
      await createBankAccount(type)
      router.refresh()
    } catch (error) {
      console.error('Failed to create account:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleCreateAccount('checking')}
        disabled={loading}
        size="sm"
        variant="default"
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Checking Account
      </Button>
      <Button
        onClick={() => handleCreateAccount('savings')}
        disabled={loading}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Savings Account
      </Button>
    </div>
  )
}
