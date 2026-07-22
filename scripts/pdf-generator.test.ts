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
    dateCreated: '01. 04. 2026 – 30. 04. 2026',
    statementNumber: '4/2026',
    transactions: [] as any[],
  }

  // Test 1: 10 transactions -> should fit on 1 page (max 12 on first page)
  for (let i = 0; i < 10; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      settlementDate: '06. 04. 2026',
      description: `Tx ${i}`,
      amount: 10,
      fees: 0,
      resultingBalance: 1000 + i * 10,
      type: 'incoming',
    })
  }

  let html = await generateTransactionsPdf(statementData as any)
  let viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 1, '10 transactions should fit on 1 page')

  // Test 2: 13 transactions -> should take 2 pages (12 + 1)
  for (let i = 10; i < 13; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      settlementDate: '06. 04. 2026',
      description: `Tx ${i}`,
      amount: 10,
      fees: 0,
      resultingBalance: 1000 + i * 10,
      type: 'incoming',
    })
  }
  html = await generateTransactionsPdf(statementData as any)
  viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 2, '13 transactions should take 2 pages')

  // Check continuation header on 2nd page
  assert.ok(html.includes('continuation-header'), '2nd page should have continuation-header')
  assert.ok(html.includes('Strana 2/2'), '2nd page should indicate Strana 2/2')

  // Test 3: 31 transactions -> should take 3 pages (12 + 18 + 1)
  for (let i = 13; i < 31; i++) {
    statementData.transactions.push({
      date: '05. 04. 2026',
      settlementDate: '06. 04. 2026',
      description: `Tx ${i}`,
      amount: 10,
      fees: 0,
      resultingBalance: 1000 + i * 10,
      type: 'incoming',
    })
  }
  html = await generateTransactionsPdf(statementData as any)
  viewportCount = (html.match(/class="page-viewport"/g) || []).length
  assert.equal(viewportCount, 3, '31 transactions should take 3 pages')
  assert.ok(html.includes('Strana 3/3'), '3rd page should indicate Strana 3/3')
}

async function testPaymentConfirmationDate() {
  const paymentData = {
    transactionId: 'txn-123',
    createdAt: '15.07.2026 12:34:56',
    status: 'Štandardný platobný príkaz',
    transferType: 'external' as const,
    fromAccountNumber: 'SK0000000000000000000000',
    recipientName: 'Jan Kovac',
    recipientAccountOrEmail: 'SK1111111111111111111111',
    amount: '100',
    currency: 'EUR',
    variableSymbol: '12345',
    constantSymbol: '0308',
    specificSymbol: '',
    note: 'Test note',
    payerReference: '',
    dueDate: '15.07.2026',
    repeatDays: '',
    createTemplate: false,
    emailConfirmation: false,
    balanceBefore: '1000',
    balanceAfter: '900',
  }

  const html = generatePaymentConfirmationHtml(paymentData)
  
  // Dátum valuty (15.07.2026) and Dátum zúčtovania (15.07.2026) must match the createdAt date
  assert.ok(html.includes('15.07.2026'), 'HTML should contain the transaction date')
  
  // Ensure that tomorrow's date (16.07.2026) is NOT present in the HTML anymore
  assert.ok(!html.includes('16.07.2026'), 'HTML should not contain tomorrow\'s date (16.07.2026)')

  // George kľúč HTML potvrdenie – musí byť uložiteľné ako .html
  assert.ok(html.includes('<!DOCTYPE html>'), 'confirmation must be full HTML document')
  assert.ok(html.includes('Jan Kovac'), 'recipient name in HTML')
  assert.ok(html.length > 500, 'HTML body non-trivial')
}

async function testPaymentConfirmationFilename() {
  const { getPaymentConfirmationFilename } = await import('../lib/payment-confirmation-pdf')
  const name = getPaymentConfirmationFilename({
    transactionId: 't1',
    createdAt: '17.07.2026 10:00:00',
    status: 'x',
    transferType: 'external',
    fromAccountNumber: 'SK00',
    recipientName: 'A',
    recipientAccountOrEmail: 'SK11',
    amount: '1',
    currency: 'EUR',
    variableSymbol: '999',
    constantSymbol: '',
    specificSymbol: '',
    note: '',
    payerReference: '',
    dueDate: '',
    repeatDays: '',
    createTemplate: false,
    emailConfirmation: false,
    balanceBefore: '10',
    balanceAfter: '9',
  })
  assert.match(name, /\.html$/i, 'filename ends with .html')
  assert.match(name, /potvrdenie/i, 'filename is potvrdenie-*.html')
}

Promise.all([
  testPaginationLogic(),
  testPaymentConfirmationDate(),
  testPaymentConfirmationFilename(),
]).then(() => {
  console.log('All PDF and confirmation tests passed')
})
