'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { formatTransactionDateMedium } from '@/lib/format-date'
import { getCategoryConfigByName, categorizeTransaction } from '@/lib/categories'

interface Transaction {
  id: string
  fromAccountId: string | null
  toAccountId: string | null
  amount: number
  balanceBefore: number | null
  balanceAfter: number | null
  type: string
  description: string | null
  status: string
  createdAt: string
}

interface DashboardPaymentClientProps {
  user: { name: string | null; email: string }
  month: string
  monthLabel: string
  account: {
    id: string
    accountNumber: string
    displayName: string
    balance: number
    currency: string
  }
  transactions: Transaction[]
}

function formatBalance(val: number) {
  return (val / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function parseTxn(txn: Transaction) {
  const desc = txn.description || ''
  if (desc.includes('|')) {
    const [name = '', note = '', categoryFromDesc = ''] = desc.split('|').map((part) => part.trim())
    const category = categoryFromDesc || categorizeTransaction(name, note, txn.type)
    return { name: name || (txn.type === 'deposit' ? 'Prichádzajúca platba' : 'Odoslaná platba'), note, category }
  }

  const isDeposit = txn.type === 'deposit'
  const name = isDeposit ? 'Prichádzajúca platba' : 'Prevod prostriedkov'
  const note = desc || 'Úspešná transakcia'
  return {
    name,
    note,
    category: categorizeTransaction(name, note, txn.type),
  }
}

function canShowPaymentConfirmation(txn: Transaction) {
  return txn.type === 'withdrawal' || txn.type === 'transfer'
}

export function DashboardPaymentClient({
  account,
  month,
  monthLabel,
  transactions,
}: DashboardPaymentClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  let depositsTotal = 0
  let withdrawalsTotal = 0
  for (const txn of transactions) {
    if (txn.type === 'deposit') depositsTotal += txn.amount
    else withdrawalsTotal += txn.amount
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(
        `/api/export/pdf?accountId=${encodeURIComponent(account.id)}&month=${encodeURIComponent(month)}`
      )
      if (!res.ok) throw new Error('Export zlyhal')
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Export error:', err)
      alert('Nepodarilo sa exportovať výpis. Skúste znovu.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <main className="flex-1 flex flex-col max-w-md mx-auto w-full pb-8">
      <div className="mx-4 mt-5 george-card glow-purple border border-slate-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{account.displayName}</p>
          <span className="text-[10px] text-slate-400 font-mono">{account.accountNumber}</span>
        </div>
        <p className="text-[28px] font-black text-white tracking-tight">
          € {formatBalance(account.balance)}
        </p>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#179f42]" />
            <span className="text-[11px] font-bold text-[#179f42]">+ € {formatBalance(depositsTotal)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#ef4444]" />
            <span className="text-[11px] font-bold text-[#ef4444]">- € {formatBalance(withdrawalsTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-6 flex items-center justify-between">
        <h2 className="text-[15px] font-black text-white tracking-wide">Platby – {monthLabel}</h2>
        <span className="text-[11px] font-bold text-slate-400">{transactions.length} transakcií</span>
      </div>

      <div className="mx-4 mt-3 flex flex-col gap-2">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            Žiadne transakcie za {monthLabel.toLowerCase()}.
          </div>
        ) : (
          transactions.map((txn) => {
            const { name, note, category } = parseTxn(txn)
            const isDeposit = txn.type === 'deposit'
            const amountStr = `${isDeposit ? '+' : '-'} € ${formatBalance(txn.amount)}`
            const catConfig = getCategoryConfigByName(category)
            const isExpanded = expandedId === txn.id

            return (
              <div key={txn.id} className="rounded-xl bg-[#101016] border border-slate-800/40 overflow-hidden transition-all hover:border-slate-800">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#1b1b26]/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1b1b26] border border-slate-800 flex items-center justify-center shrink-0">
                    {isDeposit
                      ? <ArrowDownLeft className="w-4 h-4 text-[#179f42]" />
                      : <ArrowUpRight className="w-4 h-4 text-[#ef4444]" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{name}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{formatTransactionDateMedium(txn.createdAt)}</p>
                    {category && (
                      <span className={`inline-block ${catConfig.bgClass} ${catConfig.textClass} text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 border ${catConfig.borderClass}`}>
                        {category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[14px] font-black ${isDeposit ? 'text-[#179f42]' : 'text-[#ef4444]'}`}>
                      {amountStr}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/40 flex flex-col gap-2">
                    {[
                      ['Poznámka', note],
                      ['Kategória', category],
                      ['Zostatok pred', txn.balanceBefore !== null ? `€ ${formatBalance(txn.balanceBefore)}` : '–'],
                      ['Zostatok po', txn.balanceAfter !== null ? `€ ${formatBalance(txn.balanceAfter)}` : '–'],
                      ['Typ', isDeposit ? 'Príjem' : 'Výdavok'],
                      ['ID', txn.id],
                    ].map(([label, value]) => {
                      const isCat = label === 'Kategória'
                      const cc = isCat ? getCategoryConfigByName(value as string) : null
                      return (
                        <div key={label} className="flex items-start justify-between gap-3 bg-[#1b1b26] rounded-xl px-3 py-2 border border-slate-800/20">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{label}</span>
                          {isCat && cc ? (
                            <span className={`inline-block ${cc.bgClass} ${cc.textClass} text-[9px] font-bold px-2 py-0.5 rounded-full border ${cc.borderClass}`}>
                              {value}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-white text-right break-all">{value}</span>
                          )}
                        </div>
                      )
                    })}

                    {canShowPaymentConfirmation(txn) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={`/api/export/payment-confirmation?transactionId=${encodeURIComponent(txn.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 rounded-xl bg-[#327bf5] hover:bg-blue-600 text-white text-[11px] font-bold inline-flex items-center transition-colors shadow-lg shadow-blue-900/30"
                        >
                          Zobraziť doklad
                        </a>
                        <a
                          href={`/api/export/payment-confirmation?transactionId=${encodeURIComponent(txn.id)}`}
                          download
                          className="h-8 px-3 rounded-xl bg-[#1b1b26] hover:bg-[#1b1b26]/85 text-white text-[11px] font-bold inline-flex items-center gap-1.5 border border-slate-800 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Stiahnuť
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {transactions.length > 0 && (
        <div className="mx-4 mt-8">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full h-14 rounded-xl bg-[#327bf5] hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-[15px] flex items-center justify-center gap-3 shadow-lg shadow-blue-900/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exportujem...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Exportovať výpis za {monthLabel.toLowerCase()}
                <Download className="w-4 h-4 opacity-70" />
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
            Výpis obsahuje len transakcie za zvolený mesiac v bankovom HTML formáte.
          </p>
        </div>
      )}
    </main>
  )
}