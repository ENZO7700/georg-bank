import assert from 'node:assert/strict'
import { generateTransactionsPdf } from '../lib/generate-transactions-pdf'
import { generatePaymentConfirmationHtml } from '../lib/payment-confirmation-pdf'
import { computeStatementTax } from '../lib/statement-tax'
import { StatementPdfValidationError } from '../lib/statement-pdf-profile'

const BASE_INPUT = {
  accountName: 'DALMAN group s. r. o.',
  accountNumber: 'SK04 0900 0000 0052 0896 0265',
  currency: 'EUR',
  accountProductType: 'Business účet S',
  holderAddressLines: [
    'DALMAN group s. r. o.',
    'Trebišov Hodvábna 4269/13',
    '071 01 Michalovce 1',
  ],
  statementDate: '31. 03. 2026',
  accountingPeriod: '01. 03. 2026 - 31. 03. 2026',
  statementNumber: '3/2026',
  initialBalance: 4_035_000,
  finalBalance: 4_035_000,
  depositsTotal: 4_035_000,
  withdrawalsTotal: 4_035_000,
  transactions: [] as any[],
}

async function testPaginationLogic() {
  const statementData = { ...BASE_INPUT, transactions: [] as any[] }

  for (let i = 0; i < 10; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      description: `Tx ${i}`,
      amount: 10_000,
      type: 'deposit',
    })
  }

  let html = await generateTransactionsPdf(statementData)
  let viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 1, '10 transactions should fit on 1 page')

  for (let i = 10; i < 13; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      description: `Tx ${i}`,
      amount: 10_000,
      type: 'deposit',
    })
  }
  html = await generateTransactionsPdf(statementData)
  viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 2, '13 transactions should take 2 pages')
  assert.ok(html.includes('Strana 2/2'), '2nd page should indicate Strana 2/2')

  for (let i = 13; i < 31; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      description: `Tx ${i}`,
      amount: 10_000,
      type: 'deposit',
    })
  }
  html = await generateTransactionsPdf(statementData)
  viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 3, '31 transactions should take 3 pages')
  assert.ok(html.includes('Strana 3/3'), '3rd page should indicate Strana 3/3')
}

async function testSlspTemplateStructure() {
  const html = await generateTransactionsPdf({
    ...BASE_INPUT,
    transactionTaxTotalCents: 8009,
    transactionTaxLines: [
      { label: 'Transakčná daň', amountCents: 8003, count: 2 },
      { label: 'Transakčná daň (z poplatkov, úrokov)', amountCents: 3, count: 1 },
    ],
  })

  assert.ok(html.includes('Výpis z Účtu: Business účet S'))
  assert.ok(html.includes('č.3/2026 - Strana 1/1'))
  assert.ok(html.includes('SLOVENSKÁ'))
  assert.ok(html.includes('erste-symbol'))
  assert.ok(html.includes('Dátum vyhotovenia výpisu'))
  assert.ok(html.includes('Konečný stav Účtu'))
  assert.ok(html.includes('Transakčná daň spolu:'))
  assert.ok(html.includes('Prehľad zúčtovanej Transakčnej dane:'))
  assert.ok(html.includes('Vklad podliehajúci ochrane vkladov'))
  assert.ok(!html.includes('Informácia pre klienta'))
  assert.ok(!html.includes('Nepovoleného prečerpania'))
  assert.ok(!html.includes('Zostatok<br>po transakcii'))
}

function testAutoTransactionTax() {
  const tax = computeStatementTax([
    {
      id: '1',
      date: '01. 03. 2026',
      type: 'withdrawal',
      description: 'Test|Platba|Cat|SK|',
      amount: 10_000_000,
      balanceAfter: 0,
      feeCents: 15,
    },
    {
      id: '2',
      date: '02. 03. 2026',
      type: 'withdrawal',
      description: 'Test|Platba|Cat|SK|',
      amount: 10_000_000,
      balanceAfter: 0,
    },
  ])

  assert.equal(tax.lines[0]?.count, 2)
  assert.equal(tax.lines[0]?.amountCents, 80_000)
  assert.equal(tax.lines[1]?.amountCents, 3)
  assert.equal(tax.totalCents, 80_003)
}

async function testValidationErrors() {
  await assert.rejects(
    () =>
      generateTransactionsPdf({
        ...BASE_INPUT,
        holderAddressLines: [],
      }),
    StatementPdfValidationError,
  )

  await assert.rejects(
    () =>
      generateTransactionsPdf({
        ...BASE_INPUT,
        accountingPeriod: '01/03/2026-31/03/2026',
      }),
    StatementPdfValidationError,
  )
}

async function testPaymentConfirmationDate() {
  const paymentData = {
    transactionId: 'txn-123',
    createdAt: '15.07.2026 12:34:56',
    status: 'Štandardný platobný príkaz',
    transferType: 'external' as const,
    fromAccountNumber: 'SK0000000000000000000000',
    recipientName: 'Test Recipient',
    recipientAccountOrEmail: 'SK0000000000000000000001',
    amount: '100.00',
    currency: 'EUR',
    variableSymbol: '123456',
    constantSymbol: '',
    specificSymbol: '',
    note: '',
    payerReference: '',
    dueDate: '',
    repeatDays: '',
    createTemplate: false,
    emailConfirmation: false,
    balanceBefore: '1000.00',
    balanceAfter: '900.00',
  }

  const html = generatePaymentConfirmationHtml(paymentData)
  assert.ok(html.includes('15.07.2026'))
}

async function run() {
  await testPaginationLogic()
  await testSlspTemplateStructure()
  testAutoTransactionTax()
  await testValidationErrors()
  await testPaymentConfirmationDate()
  console.log('pdf-generator.test.ts: all tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
