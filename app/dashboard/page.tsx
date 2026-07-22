import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { guestLoginPath } from '@/lib/guest-auth'
import { getBankAccounts, getTransactions } from '@/app/actions/banking'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardClient } from '@/components/dashboard-client'
import { db } from '@/lib/db'
import { bankAccount } from '@/lib/db/schema'
import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'

export const metadata = {
  title: 'George – nový Internetbanking – Slovenská sporiteľňa, a.s.',
  description: 'George klientska zóna',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(guestLoginPath('/dashboard'))

  // Fetch bank accounts and remove duplicate checking accounts if any exist
  let accounts = await getBankAccounts()
  const checkingAccounts = accounts.filter(acc => acc.accountType === 'checking')
  
  if (checkingAccounts.length > 1) {
    try {
      // Keep the first checking account, delete the rest
      const idsToDelete = checkingAccounts.slice(1).map(acc => acc.id)
      for (const id of idsToDelete) {
        await db.delete(bankAccount).where(eq(bankAccount.id, id))
      }
      accounts = await getBankAccounts()
    } catch (err) {
      console.error('Failed to clean up duplicate checking accounts:', err)
    }
  }

  // Auto-seed a SPACE bank account with 0.85 balance if database is empty (for testing)
  if (accounts.length === 0) {
    try {
      const random8Digits = Math.floor(10000000 + Math.random() * 90000000).toString()
      const accountNumber = `SK67 0900 0000 0050 ${random8Digits.slice(0, 4)} ${random8Digits.slice(4)}`
      await db.insert(bankAccount).values({
        id: uuidv4(),
        userId: session.user.id,
        accountNumber,
        accountType: 'checking',
        balance: 1000000,
        currency: 'EUR',
      })
      accounts = await getBankAccounts()
    } catch (err) {
      console.error('Failed to seed local account:', err)
    }
  } else if (accounts[0] && accounts[0].balance < 50000) {
    try {
      await db.update(bankAccount).set({ balance: 1000000 }).where(eq(bankAccount.id, accounts[0].id))
      accounts = await getBankAccounts()
    } catch (err) {
      console.error('Failed to update balance:', err)
    }
  }

  // Ensure accounts are typed correctly for the client component
  const typedAccounts = accounts.map(acc => ({
    id: acc.id,
    accountNumber: acc.accountNumber,
    accountType: acc.accountType,
    balance: acc.balance,
    currency: acc.currency,
    isActive: acc.isActive,
  }))
  const transactions = await getTransactions(50)
  const typedTransactions = transactions.map(txn => ({
    id: txn.id,
    fromAccountId: txn.fromAccountId,
    toAccountId: txn.toAccountId,
    amount: txn.amount,
    balanceBefore: txn.balanceBefore,
    balanceAfter: txn.balanceAfter,
    type: txn.type,
    description: txn.description,
    status: txn.status,
    createdAt: txn.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#121620]">
      <DashboardHeader
        user={session.user}
        account={typedAccounts[0] ? {
          displayName: 'SPACE účet',
          balance: typedAccounts[0].balance,
          currency: typedAccounts[0].currency,
        } : undefined}
      />
      <DashboardClient
        user={session.user}
        accounts={typedAccounts}
        transactions={typedTransactions}
      />
    </div>
  )
}
