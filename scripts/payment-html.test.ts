/**
 * Unit: HTML potvrdenie obsahuje všetky platobné údaje.
 * Run: npx tsx scripts/payment-html.test.ts
 */
import assert from 'node:assert/strict'
import {
  generatePaymentConfirmationHtml,
  getPaymentConfirmationFilename,
  type PaymentConfirmationPdfData,
} from '../lib/payment-confirmation-pdf'

const data: PaymentConfirmationPdfData = {
  transactionId: 'mock-test-001',
  createdAt: '17.07.2026 15:30:00',
  status: 'Štandardný platobný príkaz',
  transferType: 'external',
  fromAccountNumber: 'SK9009000000000098765432',
  recipientName: 'Mária Nováková',
  recipientAccountOrEmail: 'SK8090000000001234567890',
  amount: '0.25',
  currency: 'EUR',
  variableSymbol: '20260717',
  constantSymbol: '0308',
  specificSymbol: '',
  note: 'Test HTML',
  payerReference: '',
  dueDate: 'Dnes',
  repeatDays: '0',
  createTemplate: false,
  emailConfirmation: false,
  balanceBefore: '0.53',
  balanceAfter: '0.28',
}

const html = generatePaymentConfirmationHtml(data)
const filename = getPaymentConfirmationFilename(data)

assert.match(filename, /\.html$/i, 'filename ends with .html')
assert.match(filename, /potvrdenie/i, 'filename is potvrdenie-*')
assert.ok(filename.includes('20260717'), 'filename contains VS')

assert.ok(html.includes('<!DOCTYPE html>'), 'full HTML document')
assert.ok(html.includes('Mária Nováková'), 'recipient name')
assert.ok(html.includes('Test HTML'), 'note in HTML')
// VS is encoded in filename; body has note, amount, IBAN, name
assert.ok(/0[,.]25/.test(html), 'amount 0.25 in HTML')
assert.ok(html.replace(/\s+/g, '').includes('SK8090000000001234567890'), 'recipient IBAN')
assert.ok(html.length > 1000, 'HTML is substantial')

console.log('payment-html unit tests passed')
console.log('  file:', filename)
console.log('  html bytes:', html.length)
