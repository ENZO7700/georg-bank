import assert from 'node:assert/strict'
import { generateTransactionsPdf } from '../lib/generate-transactions-pdf'
import { generatePaymentConfirmationHtml } from '../lib/payment-confirmation-pdf'

async function testPaginationLogic() {
  const statementData = {
    accountName: 'Test Account',
    accountNumber: 'SK0000000000000000000000',
    initialBalance: 1000,
    finalBalance: 1200,
    depositsTotal: 500,
    withdrawalsTotal: 300,
    currency: 'EUR',
    statementDate: '30. 04. 2026',
    accountingPeriod: '01. 04. 2026 - 30. 04. 2026',
    statementNumber: '4/2026',
    transactions: [] as any[],
  }

  for (let i = 0; i < 10; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      description: `Tx ${i}`,
      amount: 10,
      type: 'deposit',
    })
  }

  let html = await generateTransactionsPdf(statementData as any)
  let viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 1, '10 transactions should fit on 1 page')

  for (let i = 10; i < 13; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      description: `Tx ${i}`,
      amount: 10,
      type: 'deposit',
    })
  }
  html = await generateTransactionsPdf(statementData as any)
  viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 2, '13 transactions should take 2 pages')
  assert.ok(html.includes('Strana 2/2'), '2nd page should indicate Strana 2/2')

  for (let i = 13; i < 31; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      description: `Tx ${i}`,
      amount: 10,
      type: 'deposit',
    })
  }
  html = await generateTransactionsPdf(statementData as any)
  viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 3, '31 transactions should take 3 pages')
  assert.ok(html.includes('Strana 3/3'), '3rd page should indicate Strana 3/3')
}

async function testSlspTemplateStructure() {
  const html = await generateTransactionsPdf({
    accountName: 'DALMAN group s. r. o.',
    accountNumber: 'SK04 0900 0000 0052 0896 0265',
    currency: 'EUR',
    accountProductType: 'Business účet S',
    holderAddressLines: ['Trebišov Hodvábna 4269/13', '071 01 Michalovce 1'],
    statementDate: '31. 03. 2026',
    accountingPeriod: '01. 03. 2026 - 31. 03. 2026',
    statementNumber: '3/2026',
    initialBalance: 4_035_000,
    finalBalance: 4_035_000,
    depositsTotal: 4_035_000,
    withdrawalsTotal: 4_035_000,
    transactionTaxTotalCents: 8009,
    transactionTaxLines: [
      { label: 'Transakčná daň', amountCents: 8003, count: 2 },
      { label: 'Transakčná daň (z poplatkov, úrokov)', amountCents: 3, count: 1 },
    ],
    transactions: [],
  })

  assert.ok(html.includes('Výpis z Účtu: Business účet S'))
  assert.ok(html.includes('č.3/2026 - Strana 1/1'))
  assert.ok(html.includes('Dátum vyhotovenia výpisu'))
  assert.ok(html.includes('Konečný stav Účtu'))
  assert.ok(html.includes('Transakčná daň spolu:'))
  assert.ok(html.includes('Prehľad zúčtovanej Transakčnej dane:'))
  assert.ok(html.includes('Vklad podliehajúci ochrane vkladov'))
  assert.ok(!html.includes('Informácia pre klienta'))
  assert.ok(!html.includes('Nepovoleného prečerpania'))
  assert.ok(!html.includes('Zostatok<br>po transakcii'))
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
  await testPaymentConfirmationDate()
  console.log('pdf-generator.test.ts: all tests passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
