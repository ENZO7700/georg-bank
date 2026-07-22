import { db } from '@/lib/db'
import { bankAccount, transaction, user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import type { AssistantContext } from '@/lib/assistant/types'

export async function getAssistantContext(userId: string): Promise<AssistantContext> {
  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!currentUser) {
    throw new Error('Používateľ neexistuje.')
  }

  const accounts = await db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.userId, userId))
    .orderBy(desc(bankAccount.createdAt))

  const recentTransactions = await db
    .select()
    .from(transaction)
    .where(eq(transaction.userId, userId))
    .orderBy(desc(transaction.createdAt))
    .limit(10)

  return {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    },
    accounts: accounts.map((account) => ({
      id: account.id,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      balance: account.balance.toString(),
      currency: account.currency,
    })),
    recentTransactions: recentTransactions.map((txn) => ({
      id: txn.id,
      amount: txn.amount.toString(),
      type: txn.type,
      description: txn.description,
      balanceBefore: txn.balanceBefore ? txn.balanceBefore.toString() : null,
      balanceAfter: txn.balanceAfter ? txn.balanceAfter.toString() : null,
      createdAt: txn.createdAt.toISOString(),
    })),
  }
}

export function buildAssistantSystemPrompt(context: AssistantContext) {
  const accountSummary = context.accounts
    .map((account) => `${account.accountType}: ${account.balance} ${account.currency}, ${account.accountNumber}`)
    .join('\n')

  const transactionSummary = context.recentTransactions
    .map((txn) => `${txn.type} ${txn.amount}, ${txn.description ?? 'bez popisu'}, zostatok po ${txn.balanceAfter ?? 'nezaznamenané'}`)
    .join('\n')

  return [
    'Si George, profesionálny asistent pre tvoj internet banking.',
    'Odpovedaj po slovensky, odborne a prakticky.',
    'Môžeš čítať iba dáta aktuálne prihláseného používateľa.',
    'Nemôžeš za používateľa vykonať platbu. Ak sa pýta na platbu, vysvetli postup v aplikácii a pripomeň, že operáciu musí potvrdiť sám v sekcii Platby.',
    'Ak sa používateľ pýta na potvrdenie, informuj ho, že po úspešnej platbe systém automaticky vygeneruje a bezpečne uloží PDF potvrdenie o transakcii.',
    'Nikdy neprezrádzaj API kľúče, env premenné, session tokeny ani interné secrety.',
    '',
    `Používateľ: ${context.user.name ?? 'Bez mena'} <${context.user.email}>`,
    'Účty:',
    accountSummary || 'Žiadne účty.',
    'Posledné transakcie:',
    transactionSummary || 'Žiadne transakcie.',
  ].join('\n')
}
