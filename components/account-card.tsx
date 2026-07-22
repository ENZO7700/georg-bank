import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, ArrowUpRight } from 'lucide-react'

interface BankAccount {
  id: string
  accountNumber: string
  accountType: string
  balance: string | number
  currency: string
  isActive: boolean
}

export function AccountCard({ account }: { account: BankAccount }) {
  const balance = Number(account.balance) / 100

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-0 text-white">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6" />
          <div>
            <p className="text-sm font-medium text-gray-300 capitalize">
              {account.accountType}
            </p>
            <p className="text-xs text-gray-400">{account.accountNumber}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          account.isActive
            ? 'bg-green-500/20 text-green-300'
            : 'bg-red-500/20 text-red-300'
        }`}>
          {account.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-300 mb-1">Balance</p>
        <p className="text-3xl font-bold">
          {account.currency} {balance.toFixed(2)}
        </p>
      </div>

      <Link href={`/dashboard/accounts/${account.id}`}>
        <Button 
          variant="secondary" 
          className="w-full gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          Send Money
        </Button>
      </Link>
    </Card>
  )
}
