import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { guestLoginPath } from '@/lib/guest-auth'
import { getAccountTransactions, getBankAccounts } from '@/app/actions/banking'
import { AccountDetailsClient } from '@/components/account-details-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(guestLoginPath(`/dashboard/accounts/${id}`))

  const accounts = await getBankAccounts()
  const account = accounts.find((acc) => acc.id === id)

  if (!account) {
    redirect('/dashboard')
  }

  const transactions = await getAccountTransactions(id, 50)

  // Format account properties
  const typedAccount = {
    id: account.id,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance,
    currency: account.currency,
    isActive: account.isActive,
  }

  // Format transactions list
  const typedTransactions = transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    balanceBefore: t.balanceBefore,
    balanceAfter: t.balanceAfter,
    type: t.type,
    description: t.description,
    status: t.status,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  }))

  return (
    <AccountDetailsClient 
      user={session.user} 
      account={typedAccount} 
      initialTransactions={typedTransactions} 
    />
  )
}
