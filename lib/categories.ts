export interface CategoryConfig {
  id: string
  name: string
  bgClass: string
  textClass: string
  borderClass: string
}

export const CATEGORIES: Record<string, CategoryConfig> = {
  it_software: {
    id: 'it_software',
    name: 'IT a softvér',
    bgClass: 'bg-[#0f2a4a]',
    textClass: 'text-[#82b1ff]',
    borderClass: 'border-[#1e3c72]',
  },
  fees_taxes: {
    id: 'fees_taxes',
    name: 'Dane a poplatky',
    bgClass: 'bg-[#3b181a]',
    textClass: 'text-[#ff8a80]',
    borderClass: 'border-[#c62828]',
  },
  business: {
    id: 'business',
    name: 'Podnikanie',
    bgClass: 'bg-[#1b3d22]',
    textClass: 'text-[#a5d6a7]',
    borderClass: 'border-[#2e7d32]',
  },
  travel_transport: {
    id: 'travel_transport',
    name: 'Cestovanie a doprava',
    bgClass: 'bg-[#3e2723]',
    textClass: 'text-[#d7ccc8]',
    borderClass: 'border-[#4e342e]',
  },
  savings_investment: {
    id: 'savings_investment',
    name: 'Sporenie a investície',
    bgClass: 'bg-[#311b92]',
    textClass: 'text-[#d1c4e9]',
    borderClass: 'border-[#4527a0]',
  },
  shopping: {
    id: 'shopping',
    name: 'Potraviny a nákupy',
    bgClass: 'bg-[#4a270f]',
    textClass: 'text-[#ffcc80]',
    borderClass: 'border-[#ef6c00]',
  },
  personal: {
    id: 'personal',
    name: 'Osobné transfery',
    bgClass: 'bg-[#004d40]',
    textClass: 'text-[#80cbc4]',
    borderClass: 'border-[#00695c]',
  },
  other_expenses: {
    id: 'other_expenses',
    name: 'Nezaradené výdavky',
    bgClass: 'bg-[#1a1b2e]',
    textClass: 'text-[#8fa0c4]',
    borderClass: 'border-[#2b2d4f]',
  },
  other_income: {
    id: 'other_income',
    name: 'Ostatné nepravidelné príjmy',
    bgClass: 'bg-[#1b2a47]',
    textClass: 'text-[#82b1ff]',
    borderClass: 'border-[#1e3c72]',
  },
}

export function categorizeTransaction(name: string, note: string = '', type: string = 'withdrawal'): string {
  const text = `${name} ${note}`.toLowerCase()

  if (type === 'deposit') {
    if (
      text.includes('dopravoprojekt') ||
      text.includes('099 s.r.o.') ||
      text.includes('099 s. r. o.') ||
      text.includes('faktúra') ||
      text.includes('príjem') ||
      text.includes('consulting')
    ) {
      return CATEGORIES.business.name
    }
    if (text.includes('denis') || text.includes('migaľ') || text.includes('michal') || text.includes('judita') || text.includes('amir')) {
      return CATEGORIES.personal.name
    }
    return CATEGORIES.other_income.name
  }

  // Withdrawals / transfers
  if (
    text.includes('paddle') ||
    text.includes('google') ||
    text.includes('chatbot') ||
    text.includes('hosting') ||
    text.includes('server')
  ) {
    return CATEGORIES.it_software.name
  }
  if (
    text.includes('daň') ||
    text.includes('poplatok') ||
    text.includes('ekolky') ||
    text.includes('tax') ||
    text.includes('daňov')
  ) {
    return CATEGORIES.fees_taxes.name
  }
  if (
    text.includes('idoklad') ||
    text.includes('kros') ||
    text.includes('faktura') ||
    text.includes('biznis') ||
    text.includes('dalman')
  ) {
    return CATEGORIES.business.name
  }
  if (
    text.includes('vintrica') ||
    text.includes('shell') ||
    text.includes('doprava') ||
    text.includes('nafta') ||
    text.includes('benzin') ||
    text.includes('slovnaft') ||
    text.includes('vignette')
  ) {
    return CATEGORIES.travel_transport.name
  }
  if (
    text.includes('space') ||
    text.includes('sporenie') ||
    text.includes('invest') ||
    text.includes('fondy')
  ) {
    return CATEGORIES.savings_investment.name
  }
  if (
    text.includes('tesco') ||
    text.includes('lidl') ||
    text.includes('alza') ||
    text.includes('nakup') ||
    text.includes('billa') ||
    text.includes('obchod')
  ) {
    return CATEGORIES.shopping.name
  }

  return CATEGORIES.other_expenses.name
}

export function getCategoryConfigByName(name: string): CategoryConfig {
  const match = Object.values(CATEGORIES).find((c) => c.name === name)
  return match || CATEGORIES.other_expenses
}
