'use client'

type PdfGenerateOverlayProps = {
  open: boolean
  phase?: 'preparing' | 'done'
  label?: string
}

export function PdfGenerateOverlay({
  open,
  phase = 'preparing',
  label,
}: PdfGenerateOverlayProps) {
  if (!open) return null

  const text =
    label || (phase === 'done' ? 'Hotovo' : 'Pripravujem PDF…')

  return (
    <div
      data-testid="pdf-generate-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      role="status"
      aria-live="polite"
      aria-busy={phase !== 'done'}
    >
      <div className="w-full max-w-xs rounded-2xl border border-slate-700/80 bg-[#12131b] px-5 py-6 shadow-2xl shadow-black/40">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#327bf5]/20">
          <svg
            className={`h-6 w-6 text-[#327bf5] ${phase === 'preparing' ? 'animate-pulse' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
          </svg>
        </div>
        <p className="text-center text-sm font-bold text-white">{text}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full bg-[#327bf5] transition-all duration-500 ${
              phase === 'done' ? 'w-full' : 'w-2/3 animate-pulse'
            }`}
          />
        </div>
      </div>
    </div>
  )
}
