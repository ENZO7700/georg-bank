export const SLSP_BANK = {
  name: 'Slovenská sporiteľňa, a.s.',
  address: 'Tomášikova 48, 832 37 Bratislava',
  ico: 'IČO 00 151 653, zapísaná v Obchodnom registri',
  registry: 'Mestského súdu Bratislava III., oddiel Sa, vložka č. 601/B',
} as const

export const SLSP_CONTACT = {
  email: 'info@slsp.sk',
  phone: 'Klientske centrum: 0850 111 888',
  website: 'www.slsp.sk',
} as const

export const SLSP_LEGAL_NOTICE =
  'Vklad podliehajúci ochrane vkladov v súlade so zákonom. Viac informácií získate v Informačnom formulári pre vkladateľa, ktorý Vám bol doručený alebo odovzdaný.'

/** Erste Group symbol — inline SVG pre SLSP hlavičku. */
export const SLSP_LOGO_SVG = `<svg class="erste-symbol" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="32" height="32" rx="2" fill="#E30613"/>
  <path fill="#FFFFFF" d="M8 22V10h3.2c2.8 0 4.6 1.5 4.6 3.9 0 2.1-1.4 3.4-3.5 3.7L17.5 22H14l-2.6-3.8H11V22H8zm3-6.1h.4c1.1 0 1.7-.5 1.7-1.3 0-.8-.6-1.2-1.7-1.2h-.4v2.5zM18.5 22l4.8-12h3.1l-4.8 12h-3.1z"/>
</svg>`

export function buildSlspLogoHtml(): string {
  return `
    <div class="logo-row">
      <div class="logo-text-col">
        <div class="logo-main-row">
          <span class="logo-title">SLOVENSKÁ</span>
          <span class="logo-icon-wrapper">${SLSP_LOGO_SVG}</span>
        </div>
        <span class="logo-subtitle">sporiteľňa</span>
      </div>
    </div>`
}

export function buildSlspBankBlockHtml(compact = false): string {
  if (compact) {
    return `<div class="bank-block bank-block-compact">${SLSP_BANK.name}</div>`
  }

  return `
      <div class="bank-block">
        ${buildSlspLogoHtml()}
        ${SLSP_BANK.name}<br>
        ${SLSP_BANK.address}<br>
        ${SLSP_BANK.ico}<br>
        ${SLSP_BANK.registry}
      </div>`
}

export function buildSlspFooterHtml(): string {
  return `
    <div class="footer">
      <div class="footer-item">${SLSP_CONTACT.email}</div>
      <div class="footer-item">${SLSP_CONTACT.phone}</div>
      <div class="footer-item">${SLSP_CONTACT.website}</div>
    </div>`
}

export function buildSlspLegalNoticeHtml(): string {
  return `<div class="legal-notice">${SLSP_LEGAL_NOTICE}</div>`
}
