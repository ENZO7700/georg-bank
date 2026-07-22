import assert from 'node:assert/strict'
import {
  generateBulkStatements,
  generateMonthStatement,
} from '../lib/statement-generator'

function testMonthTransactionCount() {
  const statement = generateMonthStatement(
    2026,
    4,
    {
      accountNumber: 'SK67 0900 0000 0050 1234 5678',
      transactionsPerMonth: 15,
      averageMonthlyTurnoverEur: 4000,
      mix: { outgoing: 70, incoming: 20, topup: 10 },
      seed: 123,
    },
    500_000,
    () => 0.42,
  )

  assert.equal(statement.transactions.length, 15)
  assert.equal(statement.entries.length, 15)
}

function testBalancesAreConsistent() {
  const statement = generateMonthStatement(
    2026,
    3,
    {
      accountNumber: 'SK67 0900 0000 0050 1234 5678',
      transactionsPerMonth: 20,
      averageMonthlyTurnoverEur: 3000,
      mix: { outgoing: 70, incoming: 20, topup: 10 },
      seed: 99,
    },
    1_000_000,
    () => 0.33,
  )

  let balance = statement.initialBalance
  for (const entry of statement.entries) {
    assert.equal(entry.balanceBefore, balance)
    balance = entry.type === 'withdrawal' ? balance - entry.amount : balance + entry.amount
    assert.equal(entry.balanceAfter, balance)
  }

  assert.equal(statement.finalBalance, balance)
}

function testBulkGeneratesThreeMonths() {
  const statements = generateBulkStatements({
    accountNumber: 'SK67 0900 0000 0050 1234 5678',
    transactionsPerMonth: 12,
    averageMonthlyTurnoverEur: 2500,
    mix: { outgoing: 70, incoming: 20, topup: 10 },
    seed: 7,
  })

  assert.equal(statements.length, 3)
  for (const statement of statements) {
    assert.equal(statement.transactions.length, 12)
    const turnover = statement.transactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0)
    assert.ok(turnover > 0)
  }
}

testMonthTransactionCount()
testBalancesAreConsistent()
testBulkGeneratesThreeMonths()

console.log('statement-generator tests passed')