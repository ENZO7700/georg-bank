import { Card } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react'

interface Transaction {
  id: string
  amount: string | number
  type: string
  description: string | null
  status: string
  createdAt: Date
}

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'withdrawal':
        return <ArrowDownLeft className="w-4 h-4 text-red-500" />
      case 'transfer':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />
      default:
        return <Plus className="w-4 h-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600'
      case 'withdrawal':
        return 'text-red-600'
      case 'transfer':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-2">
      {transactions.map((txn) => (
        <Card key={txn.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-full">
                {getTransactionIcon(txn.type)}
              </div>
              <div>
                <p className="font-medium text-foreground capitalize">
                  {txn.type}
                </p>
                <p className="text-sm text-muted-foreground">
                  {txn.description || new Date(txn.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${getTransactionColor(txn.type)}`}>
                {txn.type === 'deposit' ? '+' : '-'}${
                  typeof txn.amount === 'string'
                    ? parseFloat(txn.amount).toFixed(2)
                    : txn.amount.toFixed(2)
                }
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {txn.status}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
