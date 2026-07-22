export interface TransactionRow {
  id: string
  date: string // createdAt formatted
  type: string
  description: string | null
  amount: number // in cents
  balanceAfter: number | null // in cents
}

export interface TransactionsPdfInput {
  accountName: string
  accountNumber: string
  currency: string
  dateCreated: string
  transactions: TransactionRow[]
  initialBalance: number // in cents
  finalBalance: number // in cents
  depositsTotal: number // in cents
  withdrawalsTotal: number // in cents
}

function formatBalance(valCents: number): string {
  const val = valCents / 100
  return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
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

function getBicFromIban(ibanStr: string): string {
  const cleanIban = ibanStr.replace(/\s+/g, '').toUpperCase()
  if (cleanIban.startsWith('SK') && cleanIban.length >= 8) {
    const bankCode = cleanIban.substring(4, 8)
    const bicMap: Record<string, string> = {
      '0900': 'GIBASKBX', // Slovenská sporiteľňa (SLSP)
      '0200': 'SUBASKBX', // VÚB banka
      '1100': 'TATRSKBX', // Tatra banka
      '1111': 'UNCRSKBX', // UniCredit Bank
      '5600': 'KOISSKBX', // Prima banka
      '7500': 'CEKOSKBX', // ČSOB
      '8360': 'FIOZSKBA', // Fio banka
      '8330': 'FIOZSKBA', // Fio banka
      '6500': '3650SKBX', // 365.bank
      '5200': 'OTPVSKBX', // OTP Banka
      '0720': 'NBSKSRBA', // NBS
    }
    return bicMap[bankCode] || ''
  }
  return ''
}

export async function generateTransactionsPdf(data: TransactionsPdfInput): Promise<string> {
  const formattedSenderIban = formatIban(data.accountNumber)

  // Build individual row HTML strings
  const rowHtmlList: string[] = []
  
  for (const txn of data.transactions) {
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
       
       if (recipient && userNote) {
         note = `${recipient} - ${userNote}`
       } else if (recipient) {
         note = recipient
       } else if (userNote) {
         note = userNote
       }
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

    const amountStr = (isDeposit ? '' : '- ') + formatBalance(txn.amount)
    const balanceAfterStr = txn.balanceAfter !== null ? formatBalance(txn.balanceAfter) : ''

    rowHtmlList.push(`
        <div class="transaction-row" style="margin-bottom: 12px;">
          <div class="body-cell cell-left">${txn.date}</div>
          <div class="body-cell cell-left">${txn.date}</div>
          <div class="body-cell cell-left popis-cell">
            <span class="popis-title">${name}</span>
            ${note ? `<span class="popis-subtext">${note}</span>` : ''}
          </div>
          <div class="body-cell cell-right">${amountStr}</div>
          <div class="body-cell cell-right">0,00</div>
          <div class="body-cell cell-right">${balanceAfterStr}</div>
        </div>`)
  }

  // Pagination: 12 transactions on page 1, 18 on continuation pages
  const ROWS_PAGE_1 = 12
  const ROWS_PER_CONTINUATION = 18

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

  // Height for transaction box: page 1 fits 12 rows, continuation fits 18 rows
  const PAGE1_BOX_HEIGHT = '690px'
  const CONTINUATION_BOX_HEIGHT = '1020px'

  // Table header HTML (shared)
  const tableHeaderHtml = `
      <div class="table-header">
        <div class="header-cell cell-left">Dátum<br>valuty</div>
        <div class="header-cell cell-left">Dátum<br>zúčtovania</div>
        <div class="header-cell cell-left">Popis<br>transakcie</div>
        <div class="header-cell cell-right">Suma<br>transakcie</div>
        <div class="header-cell cell-right">Suma<br>poplatku</div>
        <div class="header-cell cell-right">Zostatok<br>po transakcii</div>
      </div>`

  const footerHtml = `
    <div class="footer">
      <div class="footer-item">info@slsp.sk</div>
      <div class="footer-item">Klientske centrum: 0850 111 888</div>
      <div class="footer-item">www.slsp.sk</div>
    </div>`

  // Build page HTML
  let pagesHtml = ''

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageRows = pages[pageIdx]
    const isFirstPage = pageIdx === 0
    const boxHeight = isFirstPage ? PAGE1_BOX_HEIGHT : CONTINUATION_BOX_HEIGHT
    const pageNumber = pageIdx + 1
    const totalPages = pages.length

    const emptyRowsHtml = pageRows.length === 0
      ? `<div style="text-align: center; font-size: 14px; padding: 20px 0; color: #1a1919;">Žiadne transakcie v tomto období.</div>`
      : ''

    if (isFirstPage) {
      pagesHtml += `
  <div class="page-viewport">
    <div class="page">
    <div class="vertical-text">MO10_v203_1000280073</div>
    <div class="header-section">
      <div class="logo-row">
        <div class="logo-text-col">
          <div class="logo-main-row">
            <span class="logo-title">SLOVENSKÁ</span>
          </div>
          <span class="logo-subtitle">sporiteľňa</span>
        </div>
      </div>
      <div class="bank-details">
        Slovenská sporiteľňa, a.s.<br>
        Tomášikova 48, 832 37 Bratislava<br>
        IČO 00 151 653, zapísaná v Obchodnom registri<br>
        Mestského súdu Bratislava III., oddiel Sa, vložka č. 601/B
      </div>
    </div>

    <div class="document-title">Výpis z Účtu:</div>

    <div class="details-box">
      <div class="details-col">
        <div class="details-row row-large">
          <span class="marker"></span>
          <span class="label">Názov Účtu</span>
          <span class="value value-large">${data.accountName}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Číslo Účtu</span>
          <span class="value">${formattedSenderIban}</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">BIC</span>
          <span class="value value-right">GIBASKBX</span>
        </div>
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Mena</span>
          <span class="value value-right">${data.currency}</span>
        </div>
      </div>
      <div class="details-col">
        <div class="details-row">
          <span class="marker"></span>
          <span class="label">Účtovné obdobie</span>
          <span class="value">${data.dateCreated}</span>
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
      </div>
    </div>

    <div class="info-section">
      <div class="info-title-row">
        <span class="marker"></span>
        <span class="info-title">Informácia pre klienta</span>
      </div>
      <div class="info-body">
        Vyzývame Vás na úhradu Nepovoleného prečerpania evidovaného na Vašom Účte.
      </div>
    </div>

    <div class="table-container">
      ${tableHeaderHtml}
      <div class="transaction-box" style="height: ${boxHeight};">
        ${emptyRowsHtml}${pageRows.join('')}
      </div>
    </div>

      ${footerHtml}
    </div>
  </div>`
    } else {
      // Continuation page: header with statement number, page number, and mini details bar
      pagesHtml += `
  <div class="page-viewport">
    <div class="page">
    <div class="vertical-text">MO10_v203_1000280073</div>
    <div class="continuation-header">
      <div class="continuation-title">č. 4/2026</div>
      <div class="continuation-page">Strana ${pageNumber}/${totalPages}</div>
    </div>
    
    <div class="mini-details-bar">
      <div class="mini-details-item">
        <span class="marker"></span>
        <span class="mini-label">Číslo Účtu</span>
        <span class="mini-value">${formattedSenderIban}</span>
      </div>
      <div class="mini-details-item">
        <span class="marker"></span>
        <span class="mini-label">Mena</span>
        <span class="mini-value">${data.currency}</span>
      </div>
      <div class="mini-details-item">
        <span class="marker"></span>
        <span class="mini-label">Účtovné obdobie</span>
        <span class="mini-value">01. 04. 2026 – 30. 04. 2026</span>
      </div>
    </div>

    <div class="table-container">
      ${tableHeaderHtml}
      <div class="transaction-box" style="height: ${CONTINUATION_BOX_HEIGHT};">
        ${pageRows.join('')}
      </div>
    </div>

    ${footerHtml}
    </div>
  </div>`
    }
  }

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Výpis z účtu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #f0f2f5;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1a1919;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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
      padding-top: 66px;
      padding-bottom: 44px;
      padding-left: 78px;
      padding-right: 70px;
      display: flex;
      flex-direction: column;
      transform-origin: top left;
      transform: scale(calc(100cqw / 876));
    }
    @media print {
      body {
        padding: 0;
      }
      .page-viewport {
        aspect-ratio: auto;
        contain: none;
        width: 876px;
        height: 1199px;
      }
      .page {
        position: relative;
        transform: none !important;
        box-shadow: none;
        margin: 0 !important;
      }
    }
    .vertical-text {
      position: absolute;
      left: 58px;
      bottom: 108px;
      transform: rotate(-90deg);
      transform-origin: left bottom;
      color: #a6b2b9;
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 0.5px;
      font-family: 'Inter', sans-serif;
    }
    .header-section {
      margin-bottom: 22px;
    }
    .logo-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .logo-text-col {
      display: flex;
      flex-direction: column;
      line-height: 1;
    }
    .logo-main-row {
      display: flex;
      align-items: flex-end;
    }
    .logo-title {
      font-size: 27px;
      font-weight: 900;
      color: #1a1919;
      letter-spacing: -0.5px;
    }
    .logo-icon-wrapper {
      margin-left: 10px;
      display: flex;
      align-items: center;
    }
    .erste-symbol {
      width: 32px;
      height: 32px;
    }
    .logo-subtitle {
      font-size: 21px;
      font-weight: 500;
      color: #1a1919;
      margin-top: -2px;
      letter-spacing: -0.3px;
    }
    .bank-details {
      font-size: 9.5px;
      color: #1a1919;
      line-height: 1.4;
      font-weight: 500;
    }
    .document-title {
      font-size: 19px;
      font-weight: 700;
      color: #1a1919;
      margin-bottom: 6px;
    }
    .continuation-header {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-bottom: 18px;
      line-height: 1.3;
    }
    .continuation-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a1919;
    }
    .continuation-page {
      font-size: 11px;
      font-weight: 700;
      color: #1a1919;
    }
    .mini-details-bar {
      display: flex;
      align-items: center;
      background-color: #d4e0e2;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 12px;
      gap: 16px;
    }
    .mini-details-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mini-label {
      font-size: 10px;
      font-weight: 700;
      color: #1a1919;
    }
    .mini-value {
      font-size: 10px;
      color: #1a1919;
    }
    .details-box {
      background-color: #d4e0e2;
      border-radius: 6px;
      padding: 10px 14px 12px 14px;
      display: grid;
      grid-template-columns: 1.08fr 1fr;
      grid-column-gap: 28px;
      box-sizing: border-box;
      height: 102px;
      margin-bottom: 39px;
    }
    .details-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .details-row {
      display: flex;
      align-items: center;
      position: relative;
      padding-bottom: 2px;
      border-bottom: 1.5px solid #8a9fac;
      height: 20px;
      box-sizing: border-box;
    }
    .details-row.row-large {
      height: 24px;
      padding-bottom: 3px;
    }
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
      color: #1a1919;
    }
    .value {
      font-size: 11px;
      font-weight: 700;
      color: #1a1919;
      margin-left: auto;
    }
    .value-large {
      font-size: 16px;
      font-weight: 900;
      color: #000000;
      margin-left: 6px;
    }
    .value-right {
      margin-left: auto;
    }
    .info-section {
      margin-bottom: 7px;
      display: flex;
      flex-direction: column;
    }
    .info-title-row {
      display: flex;
      align-items: center;
      border-bottom: 1.5px solid #8a9fac;
      width: 326px;
      padding-bottom: 2px;
      margin-bottom: 10px;
    }
    .info-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a1919;
    }
    .info-body {
      font-size: 12.5px;
      color: #1a1919;
      line-height: 1.4;
      font-weight: 500;
    }
    .table-container {
      display: flex;
      flex-direction: column;
    }
    .table-header {
      background-color: #d4e0e2;
      border: 1px solid #4e4f4f;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      height: 37px;
      display: grid;
      grid-template-columns: 85px 95px 1fr 90px 80px 105px;
      box-sizing: border-box;
      align-items: center;
      padding: 0 12px;
      margin-bottom: 10px;
    }
    .header-cell {
      font-size: 10px;
      font-weight: 800;
      color: #1a1919;
      line-height: 1.1;
    }
    .cell-left {
      text-align: left;
    }
    .cell-right {
      text-align: right;
    }
    .transaction-box {
      border: 1px solid #4e4f4f;
      border-radius: 8px;
      box-sizing: border-box;
      padding: 12px;
      background-color: #ffffff;
      margin-bottom: 49px;
    }
    .transaction-row {
      display: grid;
      grid-template-columns: 85px 95px 1fr 90px 80px 105px;
      align-items: start;
      box-sizing: border-box;
      page-break-inside: avoid;
    }
    .body-cell {
      font-size: 12px;
      color: #1a1919;
      line-height: 1.25;
    }
    .popis-cell {
      display: flex;
      flex-direction: column;
    }
    .popis-title {
      font-weight: 700;
      margin-bottom: 2px;
    }
    .popis-subtext {
      font-size: 11px;
      color: #1a1919;
      font-weight: 400;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      padding: 0 2px;
      margin-top: auto;
    }
    .footer-item {
      font-size: 11px;
      font-weight: 700;
      color: #1a1919;
    }
    @media print {
      body {
        background-color: #ffffff;
        gap: 0;
        padding: 0;
        overflow-x: visible;
      }
      .page {
        width: 876px !important;
        min-height: 1199px;
        box-shadow: none;
        page-break-after: always;
        margin: 0 !important;
        transform: none !important;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`
}

