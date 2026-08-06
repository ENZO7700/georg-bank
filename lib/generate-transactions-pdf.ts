export interface TransactionRow {
  id: string
  date: string
  type: string
  description: string | null
  amount: number
  balanceAfter: number | null
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
  accountProductType?: string
  holderAddressLines?: string[]
  statementDate: string
  accountingPeriod: string
  statementNumber?: string
  transactions: TransactionRow[]
  initialBalance: number
  finalBalance: number
  depositsTotal: number
  withdrawalsTotal: number
  transactionTaxTotalCents?: number
  transactionTaxLines?: TransactionTaxLine[]
  /** @deprecated Prefer statementDate + accountingPeriod */
  dateCreated?: string
}

function formatBalance(valCents: number): string {
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

function normalizePdfInput(data: TransactionsPdfInput): Required<
  Pick<
    TransactionsPdfInput,
    | 'accountProductType'
    | 'holderAddressLines'
    | 'statementDate'
    | 'accountingPeriod'
    | 'statementNumber'
    | 'transactionTaxTotalCents'
    | 'transactionTaxLines'
  >
> {
  const statementDate = data.statementDate || data.dateCreated || ''
  const accountingPeriod = data.accountingPeriod || statementDate
  const statementNumber =
    data.statementNumber ||
    (() => {
      const match = accountingPeriod.match(/(\d{2})\.\s*(\d{2})\.\s*(\d{4})\s*-\s*(\d{2})\.\s*(\d{2})\.\s*(\d{4})/)
      if (match) {
        const month = Number(match[5])
        const year = match[6]
        return `${month}/${year}`
      }
      return '1/2026'
    })()

  const taxLines = data.transactionTaxLines ?? []
  const taxTotal =
    data.transactionTaxTotalCents ??
    (taxLines.length > 0
      ? taxLines.reduce((sum, line) => sum + line.amountCents, 0)
      : 0)

  return {
    accountProductType: data.accountProductType || 'Business účet S',
    holderAddressLines: data.holderAddressLines?.length
      ? data.holderAddressLines
      : [],
    statementDate,
    accountingPeriod,
    statementNumber,
    transactionTaxTotalCents: taxTotal,
    transactionTaxLines: taxLines,
  }
}

function buildTransactionDescription(txn: TransactionRow) {
  const isDeposit = txn.type === 'deposit'
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

  return `
        <div class="transaction-row">
          <div class="body-cell cell-left">${escapeHtml(txn.date)}</div>
          <div class="body-cell cell-left">${escapeHtml(txn.date)}</div>
          <div class="body-cell cell-left popis-cell">
            <span class="popis-title">${escapeHtml(name)}</span>
            ${note ? `<span class="popis-subtext">${escapeHtml(note)}</span>` : ''}
          </div>
          <div class="body-cell cell-right">${amountStr}</div>
          <div class="body-cell cell-right">0,00</div>
        </div>`
}

function buildDetailsBox(data: TransactionsPdfInput, formattedIban: string, bic: string) {
  const normalized = normalizePdfInput(data)

  return `
    <div class="details-box">
      <div class="details-col">
        <div class="details-row row-large">
          <span class="marker"></span>
          <span class="label">Názov Účtu</span>
          <span class="value value-large">${escapeHtml(data.accountName)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Číslo Účtu</span>
          <span class="value">${formattedIban}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">BIC</span>
          <span class="value value-right">${escapeHtml(bic || 'GIBASKBX')}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Mena</span>
          <span class="value value-right">${escapeHtml(data.currency)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Dátum vyhotovenia výpisu</span>
          <span class="value value-right">${escapeHtml(normalized.statementDate)}</span>
        </div>
      </div>
      <div class="details-col">
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Účtovné obdobie</span>
          <span class="value">${escapeHtml(normalized.accountingPeriod)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Počiatočný stav Účtu</span>
          <span class="value">${formatBalance(data.initialBalance)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Vklady spolu</span>
          <span class="value">${formatBalance(data.depositsTotal)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Výbery spolu</span>
          <span class="value">- ${formatBalance(data.withdrawalsTotal)}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Konečný stav Účtu</span>
          <span class="value">${formatBalance(data.finalBalance)}</span>
        </div>
      </div>
    </div>`
}

function buildTaxBreakdownHtml(lines: TransactionTaxLine[]) {
  if (lines.length === 0) {
    return `
    <div class="tax-breakdown">
      <div class="tax-breakdown-title">Prehľad zúčtovanej Transakčnej dane:</div>
      <div class="tax-breakdown-row">
        <span class="tax-label">Transakčná daň:</span>
        <span class="tax-amount">${formatSignedBalance(0)}</span>
      </div>
    </div>`
  }

  const rows = lines
    .map(
      (line) => `
      <div class="tax-breakdown-row">
        <span class="tax-label">${escapeHtml(line.label)}:</span>
        <span class="tax-amount">${formatSignedBalance(-Math.abs(line.amountCents))}</span>
        <span class="tax-count">(${line.count} ks)</span>
      </div>`,
    )
    .join('')

  return `
    <div class="tax-breakdown">
      <div class="tax-breakdown-title">Prehľad zúčtovanej Transakčnej dane:</div>
      ${rows}
    </div>`
}

function buildHolderAddressHtml(accountName: string, lines: string[]) {
  const addressLines =
    lines.length > 0 ? lines : [accountName]
  return addressLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')
}

const TABLE_HEADER_HTML = `
      <div class="table-header">
        <div class="header-cell cell-left">Dátum<br>valuty</div>
        <div class="header-cell cell-left">Dátum<br>zúčtovania</div>
        <div class="header-cell cell-left">Popis<br>transakcie</div>
        <div class="header-cell cell-right">Suma<br>transakcie</div>
        <div class="header-cell cell-right">Suma<br>poplatku</div>
      </div>`

const FOOTER_HTML = `
    <div class="footer">
      <div class="footer-item">info@slsp.sk</div>
      <div class="footer-item">Klientske centrum: 0850 111 888</div>
      <div class="footer-item">www.slsp.sk</div>
    </div>`

const LEGAL_NOTICE_HTML = `
    <div class="legal-notice">
      Vklad podliehajúci ochrane vkladov v súlade so zákonom. Viac informácií získate v Informačnom formulári
      pre vkladateľa, ktorý Vám bol doručený alebo odovzdaný.
    </div>`

const BANK_BLOCK_HTML = `
      <div class="bank-block">
        Slovenská sporiteľňa, a.s.<br>
        Tomášikova 48, 832 37 Bratislava<br>
        IČO 00 151 653, zapísaná v Obchodnom registri<br>
        Mestského súdu Bratislava III., oddiel Sa, vložka č. 601/B
      </div>`

export async function generateTransactionsPdf(data: TransactionsPdfInput): Promise<string> {
  const normalized = normalizePdfInput(data)
  const formattedSenderIban = formatIban(data.accountNumber)
  const bic = getBicFromIban(data.accountNumber)

  const rowHtmlList = data.transactions.map(buildTransactionRowHtml)

  const ROWS_PAGE_1 = 12
  const ROWS_PER_CONTINUATION = 18
  const PAGE1_BOX_HEIGHT = '520px'
  const CONTINUATION_BOX_HEIGHT = '860px'

  const pages: string[][] = []
  if (rowHtmlList.length <= ROWS_PAGE_1) {
    pages.push(rowHtmlList)
  } else {
    pages.push(rowHtmlList.slice(0, ROWS_PAGE_1))
    let offset = ROWS_PAGE_1
    while (offset < rowHtmlList.length) {
      pages.push(rowHtmlList.slice(offset, offset + ROWS_PER_CONTINUATION))
      offset += ROWS_PER_CONTINUATION
    }
  }

  let pagesHtml = ''

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx += 1) {
    const pageRows = pages[pageIdx]
    const isFirstPage = pageIdx === 0
    const boxHeight = isFirstPage ? PAGE1_BOX_HEIGHT : CONTINUATION_BOX_HEIGHT
    const pageNumber = pageIdx + 1
    const totalPages = pages.length
    const pageMeta = `č.${normalized.statementNumber} - Strana ${pageNumber}/${totalPages}`

    const emptyRowsHtml =
      pageRows.length === 0
        ? `<div class="empty-rows">Žiadne transakcie v tomto období.</div>`
        : ''

    const taxTotalHtml = isFirstPage
      ? `
    <div class="tax-total-row">
      <span class="tax-total-label">Transakčná daň spolu:</span>
      <span class="tax-total-value">${formatSignedBalance(-Math.abs(normalized.transactionTaxTotalCents))} EUR</span>
    </div>`
      : ''

    const detailsHtml = isFirstPage ? buildDetailsBox(data, formattedSenderIban, bic) : ''
    const titleHtml = isFirstPage
      ? `<div class="document-title">Výpis z Účtu: ${escapeHtml(normalized.accountProductType)}</div>`
      : ''
    const headerAddressHtml = isFirstPage
      ? `<div class="holder-address">${buildHolderAddressHtml(data.accountName, normalized.holderAddressLines)}</div>`
      : `<div class="holder-address continuation-account">${formattedSenderIban} · ${escapeHtml(data.currency)} · ${escapeHtml(normalized.accountingPeriod)}</div>`

    pagesHtml += `
  <div class="page-viewport">
    <div class="page">
      <div class="page-meta">${pageMeta}</div>

      <div class="header-row">
        ${isFirstPage ? BANK_BLOCK_HTML : `<div class="bank-block bank-block-compact">Slovenská sporiteľňa, a.s.</div>`}
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

      ${isFirstPage ? buildTaxBreakdownHtml(normalized.transactionTaxLines) : ''}
      ${isFirstPage ? LEGAL_NOTICE_HTML : ''}
      ${FOOTER_HTML}
    </div>
  </div>`
  }

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Výpis z účtu</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f0f2f5;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: Arial, Helvetica, sans-serif;
      color: #1a1919;
      gap: 40px;
      padding: 40px 20px;
      overflow-x: auto;
    }
    .page-viewport {
      width: 100%;
      max-width: 876px;
      aspect-ratio: 876 / 1199;
      container-type: inline-size;
      margin: 0 auto;
      position: relative;
      flex-shrink: 0;
      page-break-after: always;
    }
    .page {
      width: 876px;
      height: 1199px;
      background-color: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: absolute;
      top: 0;
      left: 0;
      padding: 48px 58px 40px 68px;
      display: flex;
      flex-direction: column;
      transform-origin: top left;
      transform: scale(calc(100cqw / 876));
    }
    .page-meta {
      text-align: right;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 18px;
    }
    .header-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 18px;
      align-items: start;
    }
    .bank-block {
      font-size: 9.5px;
      line-height: 1.45;
      font-weight: 500;
    }
    .bank-block-compact {
      font-size: 11px;
      font-weight: 700;
      padding-top: 8px;
    }
    .holder-address {
      text-align: right;
      font-size: 11px;
      line-height: 1.45;
      font-weight: 500;
    }
    .continuation-account {
      font-size: 10px;
      font-weight: 700;
    }
    .document-title {
      font-size: 19px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .details-box {
      background-color: #d4e0e2;
      border-radius: 6px;
      padding: 10px 14px 12px;
      display: grid;
      grid-template-columns: 1.08fr 1fr;
      gap: 28px;
      margin-bottom: 12px;
    }
    .details-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .details-row {
      display: flex;
      align-items: center;
      border-bottom: 1.5px solid #8a9fac;
      min-height: 20px;
      padding-bottom: 2px;
    }
    .details-row.row-large { min-height: 24px; }
    .marker {
      width: 10px;
      height: 10px;
      background-color: #536f85;
      border-radius: 50%;
      margin-right: 6px;
      flex-shrink: 0;
    }
    .label {
      font-size: 11px;
      font-weight: 700;
    }
    .value {
      font-size: 11px;
      font-weight: 700;
      margin-left: auto;
      text-align: right;
    }
    .value-large {
      font-size: 16px;
      font-weight: 900;
    }
    .value-right { margin-left: auto; }
    .tax-total-row {
      display: flex;
      justify-content: flex-end;
      align-items: baseline;
      gap: 12px;
      margin: 8px 0 14px;
      font-size: 11px;
      font-weight: 700;
    }
    .tax-total-value { min-width: 120px; text-align: right; }
    .table-container { margin-bottom: 16px; }
    .table-header {
      background-color: #d4e0e2;
      border: 1px solid #4e4f4f;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      height: 37px;
      display: grid;
      grid-template-columns: 85px 95px 1fr 95px 80px;
      align-items: center;
      padding: 0 12px;
      margin-bottom: 8px;
      gap: 8px;
    }
    .header-cell {
      font-size: 10px;
      font-weight: 800;
      line-height: 1.1;
    }
    .cell-left { text-align: left; }
    .cell-right { text-align: right; }
    .transaction-box {
      border: 1px solid #4e4f4f;
      border-radius: 8px;
      padding: 12px;
      background-color: #ffffff;
    }
    .transaction-row {
      display: grid;
      grid-template-columns: 85px 95px 1fr 95px 80px;
      align-items: start;
      gap: 8px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .body-cell {
      font-size: 12px;
      line-height: 1.25;
      word-break: break-word;
    }
    .popis-cell { display: flex; flex-direction: column; }
    .popis-title { font-weight: 700; margin-bottom: 2px; }
    .popis-subtext { font-size: 11px; font-weight: 400; }
    .empty-rows {
      text-align: center;
      font-size: 14px;
      padding: 20px 0;
      color: #1a1919;
    }
    .tax-breakdown {
      margin-bottom: 14px;
      font-size: 11px;
    }
    .tax-breakdown-title {
      font-weight: 700;
      margin-bottom: 6px;
    }
    .tax-breakdown-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      margin-bottom: 4px;
    }
    .tax-label { font-weight: 500; }
    .tax-amount { font-weight: 700; text-align: right; min-width: 90px; }
    .tax-count { font-weight: 500; min-width: 48px; }
    .legal-notice {
      font-size: 9.5px;
      line-height: 1.45;
      margin-bottom: 18px;
      max-width: 92%;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      gap: 10px;
      flex-wrap: wrap;
    }
    .footer-item {
      font-size: 11px;
      font-weight: 700;
    }
    @media print {
      body { background-color: #ffffff; gap: 0; padding: 0; overflow-x: visible; }
      .page-viewport { aspect-ratio: auto; width: 876px; height: 1199px; }
      .page {
        position: relative;
        transform: none !important;
        box-shadow: none;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`
}
