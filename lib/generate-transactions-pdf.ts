import fs from 'fs'
import path from 'path'
import { computeStatementTax, resolveTransactionFeeCents } from '@/lib/statement-tax'
import {
  StatementPdfValidationError,
  validateAccountingPeriod,
  validateStatementDate,
  validateStatementNumber,
} from '@/lib/statement-pdf-profile'
import {
  buildSlspBankBlockHtml,
  buildSlspFooterHtml,
  buildSlspLegalNoticeHtml,
} from '@/lib/slsp-statement-assets'

export interface TransactionRow {
  id: string
  date: string
  type: string
  description: string | null
  amount: number
  balanceAfter: number | null
  feeCents?: number
}

export interface TransactionTaxLine {
  label: string
  amountCents: number
  count: number
}

export interface TransactionsPdfInput {
  accountName: string
  accountNumber: string
  currency: string
  accountProductType: string
  holderAddressLines: string[]
  statementDate: string
  accountingPeriod: string
  statementNumber: string
  transactions: TransactionRow[]
  initialBalance: number
  finalBalance: number
  depositsTotal: number
  withdrawalsTotal: number
  transactionTaxTotalCents?: number
  transactionTaxLines?: TransactionTaxLine[]
}

export function formatBalance(valCents: number): string {
  const val = valCents / 100
  return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function formatSignedBalance(valCents: number): string {
  if (valCents === 0) return formatBalance(0)
  const prefix = valCents < 0 ? '- ' : ''
  return `${prefix}${formatBalance(Math.abs(valCents))}`
}

function formatIban(ibanStr: string): string {
  const clean = ibanStr.replace(/\s+/g, '').toUpperCase()
  if (!clean.startsWith('SK') && !/^[A-Z]{2}\d{2}/.test(clean)) return ibanStr
  const parts = []
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4))
  }
  return parts.join(' ')
}

export function getBicFromIban(ibanStr: string): string {
  const cleanIban = ibanStr.replace(/\s+/g, '').toUpperCase()
  if (cleanIban.startsWith('SK') && cleanIban.length >= 8) {
    const bankCode = cleanIban.substring(4, 8)
    const bicMap: Record<string, string> = {
      '0900': 'GIBASKBX',
      '0200': 'SUBASKBX',
      '1100': 'TATRSKBX',
      '1111': 'UNCRSKBX',
      '5600': 'KOISSKBX',
      '7500': 'CEKOSKBX',
      '8360': 'FIOZSKBA',
      '8330': 'FIOZSKBA',
      '6500': '3650SKBX',
      '5200': 'OTPVSKBX',
      '0720': 'NBSKSRBA',
    }
    return bicMap[bankCode] || ''
  }
  return ''
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function validatePdfInput(data: TransactionsPdfInput) {
  validateStatementDate(data.statementDate)
  validateAccountingPeriod(data.accountingPeriod)
  validateStatementNumber(data.statementNumber)

  if (!data.holderAddressLines.length) {
    throw new StatementPdfValidationError('Adresa klienta musí obsahovať aspoň jeden riadok.')
  }
}

function resolveTax(data: TransactionsPdfInput) {
  if (data.transactionTaxLines && data.transactionTaxTotalCents !== undefined) {
    return {
      totalCents: data.transactionTaxTotalCents,
      lines: data.transactionTaxLines,
    }
  }

  if (data.transactionTaxLines) {
    return {
      totalCents: data.transactionTaxLines.reduce((sum, line) => sum + line.amountCents, 0),
      lines: data.transactionTaxLines,
    }
  }

  return computeStatementTax(data.transactions)
}

export function parseStatementPaymentDescription(description: string | null) {
  if (!description?.includes('|')) return null

  const parts = description.split('|').map((part) => part.trim())
  const recipientName = parts[0] || ''
  if (!recipientName) return null

  const cleanName = recipientName.replace(/\s+/g, '').toUpperCase()
  if (cleanName.startsWith('SK') && cleanName.length >= 20) return null

  return {
    recipientName,
    note: parts[1] || '',
    iban: parts[3] || '',
    variableSymbol: parts[4] || '',
  }
}

function buildPaymentTransactionDescription(txn: TransactionRow) {
  const payment = parseStatementPaymentDescription(txn.description)
  if (!payment) return null

  const ibanFormatted = payment.iban ? formatIban(payment.iban) : ''
  const notePart = payment.note ? payment.note.substring(0, 20) : 'Nepovinné'
  const subtext = [
    ibanFormatted ? `IBAN: ${ibanFormatted}` : '',
    `Var. symbol: ${payment.variableSymbol || 'Nepovinné'}`,
    `Poznámka: ${notePart || 'Nepovinné'}`,
  ]
    .filter(Boolean)
    .join(' | ')

  return {
    name: `Platba pre: ${payment.recipientName}`,
    note: subtext,
    isDeposit: false,
  }
}

function buildTransactionDescription(txn: TransactionRow) {
  const isDeposit = txn.type === 'deposit'
  if (!isDeposit) {
    const paymentDescription = buildPaymentTransactionDescription(txn)
    if (paymentDescription) return paymentDescription
  }

  const name = isDeposit ? 'Prichádzajúci štandardný príkaz' : 'Odoslaný štandardný príkaz'
  let note = ''

  if (txn.description && txn.description.includes('|')) {
    const parts = txn.description.split('|')
    let recipient = parts[0]?.trim() || ''
    const userNote = parts[1]?.trim() || ''

    const cleanRecipient = recipient.replace(/\s+/g, '').toUpperCase()
    if (cleanRecipient.startsWith('SK') && cleanRecipient.length >= 20) {
      const formatted = formatIban(cleanRecipient)
      const bic = getBicFromIban(cleanRecipient)
      recipient = formatted + (bic ? ` BIC: ${bic}` : '')
    }

    if (recipient && userNote) note = `${recipient} - ${userNote}`
    else if (recipient) note = recipient
    else if (userNote) note = userNote
  } else if (txn.description) {
    let desc = txn.description.trim()
    const cleanDesc = desc.replace(/\s+/g, '').toUpperCase()
    if (cleanDesc.startsWith('SK') && cleanDesc.length >= 20) {
      const formatted = formatIban(cleanDesc)
      const bic = getBicFromIban(cleanDesc)
      desc = formatted + (bic ? ` BIC: ${bic}` : '')
    }
    note = desc
  }

  return { name, note, isDeposit }
}

function buildTransactionRowHtml(txn: TransactionRow): string {
  const { name, note, isDeposit } = buildTransactionDescription(txn)
  const amountStr = (isDeposit ? '' : '- ') + formatBalance(txn.amount)
  const feeCents = resolveTransactionFeeCents(txn)
  const feeStr = feeCents > 0 ? formatBalance(feeCents) : '0,00'

  return `
        <div class="transaction-row">
          <div class="body-cell cell-left">${escapeHtml(txn.date)}</div>
          <div class="body-cell cell-left">${escapeHtml(txn.date)}</div>
          <div class="body-cell cell-left popis-cell">
            <span class="popis-title">${escapeHtml(name)}</span>
            ${note ? `<span class="popis-subtext">${escapeHtml(note)}</span>` : ''}
          </div>
          <div class="body-cell cell-right">${amountStr}</div>
          <div class="body-cell cell-right">${feeStr}</div>
        </div>`
}

/** Pre-formatted statement values; the only source the renderer reads from. */
interface StatementViewModel {
  accountName: string
  accountNumber: string
  bic: string
  currency: string
  accountProductType: string
  holderAddressLines: string[]
  statementDate: string
  accountingPeriod: string
  statementNumber: string
  initialBalance: string
  depositsTotal: string
  withdrawalsTotal: string
  finalBalance: string
  taxTotal: string
  taxLines: Array<{ label: string; amount: string; count: string }>
  rows: string[]
}

function buildDetailsBox(vm: StatementViewModel) {
  return `
    <div class="details-box">
      <div class="details-col">
        <div class="details-row row-large">
          <span class="marker"></span>
          <span class="label">Názov Účtu</span>
          <span class="value value-large">${escapeHtml(vm.accountName)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Číslo Účtu</span>
          <span class="value">${escapeHtml(vm.accountNumber)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">BIC</span>
          <span class="value value-right">${escapeHtml(vm.bic)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Mena</span>
          <span class="value value-right">${escapeHtml(vm.currency)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Dátum vyhotovenia výpisu</span>
          <span class="value value-right">${escapeHtml(vm.statementDate)}</span>
        </div>
      </div>
      <div class="details-col">
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Účtovné obdobie</span>
          <span class="value">${escapeHtml(vm.accountingPeriod)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Počiatočný stav Účtu</span>
          <span class="value">${escapeHtml(vm.initialBalance)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Vklady spolu</span>
          <span class="value">${escapeHtml(vm.depositsTotal)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Výbery spolu</span>
          <span class="value">${escapeHtml(vm.withdrawalsTotal)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Konečný stav Účtu</span>
          <span class="value">${escapeHtml(vm.finalBalance)}</span>
        </div>
      </div>
    </div>`
}

function buildTaxBreakdownHtml(lines: StatementViewModel['taxLines']) {
  const rows = lines
    .map(
      (line) => `
      <div class="tax-breakdown-row">
        <span class="tax-label">${escapeHtml(line.label)}:</span>
        <span class="tax-amount">${escapeHtml(line.amount)}</span>
        <span class="tax-count">${escapeHtml(line.count)}</span>
      </div>`,
    )
    .join('')

  return `
    <div class="tax-breakdown">
      <div class="tax-breakdown-title">Prehľad zúčtovanej Transakčnej dane:</div>
      ${rows}
    </div>`
}

function buildHolderAddressHtml(lines: string[]) {
  return lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')
}

const TABLE_HEADER_HTML = `
      <div class="table-header">
        <div class="header-cell cell-left">Dátum<br>valuty</div>
        <div class="header-cell cell-left">Dátum<br>zúčtovania</div>
        <div class="header-cell cell-left">Popis<br>transakcie</div>
        <div class="header-cell cell-right">Suma<br>transakcie</div>
        <div class="header-cell cell-right">Suma<br>poplatku</div>
      </div>`

function loadStatementCss(): string {
  const cssPath = path.join(process.cwd(), 'styles/slsp-statement.css')
  return fs.readFileSync(cssPath, 'utf8')
}

function renderStatementHtml(vm: StatementViewModel): string {
  const ROWS_PAGE_1 = 12
  const ROWS_PER_CONTINUATION = 18
  const PAGE1_BOX_HEIGHT = '520px'
  const CONTINUATION_BOX_HEIGHT = '860px'

  const pages: string[][] = []
  if (vm.rows.length <= ROWS_PAGE_1) {
    pages.push(vm.rows)
  } else {
    pages.push(vm.rows.slice(0, ROWS_PAGE_1))
    let offset = ROWS_PAGE_1
    while (offset < vm.rows.length) {
      pages.push(vm.rows.slice(offset, offset + ROWS_PER_CONTINUATION))
      offset += ROWS_PER_CONTINUATION
    }
  }

  let pagesHtml = ''

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx += 1) {
    const pageRows = pages[pageIdx]
    const isFirstPage = pageIdx === 0
    const boxHeight = isFirstPage ? PAGE1_BOX_HEIGHT : CONTINUATION_BOX_HEIGHT
    const pageMeta = `č.${vm.statementNumber} - Strana ${pageIdx + 1}/${pages.length}`

    const emptyRowsHtml =
      pageRows.length === 0
        ? `<div class="empty-rows">Žiadne transakcie v danom období</div>`
        : ''

    const taxTotalHtml = isFirstPage
      ? `
    <div class="tax-total-row">
      <span class="tax-total-label">Transakčná daň spolu:</span>
      <span class="tax-total-value">${escapeHtml(vm.taxTotal)}</span>
    </div>`
      : ''

    const detailsHtml = isFirstPage ? buildDetailsBox(vm) : ''
    const titleHtml = isFirstPage
      ? `<div class="document-title">Výpis z Účtu: ${escapeHtml(vm.accountProductType)}</div>`
      : ''
    const headerAddressHtml = isFirstPage
      ? `<div class="holder-address">${buildHolderAddressHtml(vm.holderAddressLines)}</div>`
      : `<div class="holder-address continuation-account">${escapeHtml(vm.accountNumber)} · ${escapeHtml(vm.currency)} · ${escapeHtml(vm.accountingPeriod)}</div>`

    pagesHtml += `
  <div class="page-viewport">
    <div class="page">
      <div class="page-meta">${pageMeta}</div>

      <div class="header-row">
        ${buildSlspBankBlockHtml(!isFirstPage)}
        ${headerAddressHtml}
      </div>

      ${titleHtml}
      ${detailsHtml}
      ${taxTotalHtml}

      <div class="table-container">
        ${TABLE_HEADER_HTML}
        <div class="transaction-box" style="min-height: ${boxHeight};">
          ${emptyRowsHtml}${pageRows.join('')}
        </div>
      </div>

      ${isFirstPage ? buildTaxBreakdownHtml(vm.taxLines) : ''}
      ${isFirstPage ? buildSlspLegalNoticeHtml() : ''}
      ${buildSlspFooterHtml()}
    </div>
  </div>`
  }

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Výpis z účtu</title>
  <style>${loadStatementCss()}</style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`
}

export async function generateTransactionsPdf(data: TransactionsPdfInput): Promise<string> {
  validatePdfInput(data)

  const tax = resolveTax(data)
  const taxLines = tax.lines.length
    ? tax.lines.map((line) => ({
        label: line.label,
        amount: formatSignedBalance(-Math.abs(line.amountCents)),
        count: `(${line.count} ks)`,
      }))
    : [{ label: 'Transakčná daň', amount: formatSignedBalance(0), count: '' }]

  return renderStatementHtml({
    accountName: data.accountName,
    accountNumber: formatIban(data.accountNumber),
    bic: getBicFromIban(data.accountNumber) || 'GIBASKBX',
    currency: data.currency,
    accountProductType: data.accountProductType,
    holderAddressLines: data.holderAddressLines,
    statementDate: data.statementDate,
    accountingPeriod: data.accountingPeriod,
    statementNumber: data.statementNumber,
    initialBalance: formatBalance(data.initialBalance),
    depositsTotal: formatBalance(data.depositsTotal),
    withdrawalsTotal: `- ${formatBalance(data.withdrawalsTotal)}`,
    finalBalance: formatBalance(data.finalBalance),
    taxTotal: `${formatSignedBalance(-Math.abs(tax.totalCents))} EUR`,
    taxLines,
    rows: data.transactions.map(buildTransactionRowHtml),
  })
}

/**
 * Data-free statement skeleton: static SLSP branding plus `{{ token }}`
 * placeholders for every value the payment flow fills in at generate time.
 */
export function renderStatementSkeletonHtml(): string {
  return renderStatementHtml({
    accountName: '{{ accountName }}',
    accountNumber: '{{ accountNumber }}',
    bic: '{{ bic }}',
    currency: '{{ currency }}',
    accountProductType: '{{ accountProductType }}',
    holderAddressLines: [
      '{{ accountName }}',
      '{{ holderAddressLine1 }}',
      '{{ holderAddressLine2 }}',
    ],
    statementDate: '{{ statementDate }}',
    accountingPeriod: '{{ accountingPeriod }}',
    statementNumber: '{{ statementNumber }}',
    initialBalance: '{{ initialBalance }}',
    depositsTotal: '{{ depositsTotal }}',
    withdrawalsTotal: '{{ withdrawalsTotal }}',
    finalBalance: '{{ finalBalance }}',
    taxTotal: '{{ transactionTaxTotal }}',
    taxLines: [{ label: 'Transakčná daň', amount: '{{ transactionTax }}', count: '' }],
    rows: [],
  })
}
