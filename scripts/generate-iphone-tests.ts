import fs from 'fs'
import path from 'path'

const OUT_DIR = path.join(__dirname, '../e2e/iphone')

type SuiteSpec = {
  file: string
  suite: string
  count: number
  topics: string[]
}

/**
 * Hand-maintained (do NOT regenerate — real assertions for PIN gate + full-bleed):
 * - e2e/iphone/auth.spec.ts
 * - e2e/iphone/dashboard.spec.ts
 *
 * Product rules these scaffolds must follow:
 * - Guest lands on PIN (`loginWithPin`); Prehľad is behind PIN
 * - No Menu / Odhlás on /dashboard2 full-bleed (desktop chrome only)
 * - Classic Menu / Odhlás live on /dashboard/payment-orders (not /dashboard2/*)
 * - Cards UI is Karty modal ("Vaše platobné karty"), not masked 4544 strings
 */
const SUITES: SuiteSpec[] = [
  {
    file: 'transactions.spec.ts',
    suite: 'iPhone – Transactions',
    count: 80,
    topics: [
      'transaction list scroll',
      'incoming green amount',
      'outgoing red amount',
      'category badge color',
      'transaction detail modal',
      'balance before/after row',
      'date formatting SK locale',
      'empty state message',
      'filter Prijaté only',
      'filter Odoslané only',
      'filter Dobitie only',
      'filter Všetko reset',
      'long description truncation',
      'multi-line note display',
      'Q2 B2B income labels',
      'SaaS vendor expenses',
      'payroll batch description',
      'tax payment description',
      'running balance consistency',
      'chronological order',
    ],
  },
  {
    file: 'export-pdf.spec.ts',
    suite: 'iPhone – Export PDF',
    count: 40,
    topics: [
      'monthly export button tap',
      'export API month param',
      'payment confirmation download',
      'HTML receipt filename',
      'A4 print page width',
      'A4 print page height',
      'multi-page statement split',
      'statement generator form',
      'bulk 3 statements flow',
      'export empty month state',
      'share sheet fallback',
      'download on slow 3G',
      'print media CSS',
      'footer inside page bounds',
      'logo on statement header',
      'transaction table wrap',
      'currency formatting PDF',
      'SK date in PDF',
      'account name in export',
      'responsive scale removed in print',
    ],
  },
  {
    file: 'gestures.spec.ts',
    suite: 'iPhone – Gestures',
    count: 40,
    topics: [
      'Nová platba tap target 44px',
      'logout via payment-orders header 44px',
      'transfer modal close swipe',
      'SPACE účet card tap',
      'filter chip tap',
      'transaction row tap',
      'scroll momentum',
      'pull-to-refresh disabled',
      'double-tap zoom disabled',
      'pinch zoom disabled',
      'long press no context menu',
      'keyboard dismiss on scroll',
      'sticky Prehľad header after fling',
      'bottom CTA thumb reach',
      'safe-area notch overlap',
      'landscape payment-orders menu overlay',
      'touch highlight removed',
      'active state on buttons',
      'form input focus scroll',
      'virtual keyboard overlay',
    ],
  },
  {
    file: 'edge-cases.spec.ts',
    suite: 'iPhone – Edge cases',
    count: 40,
    topics: [
      'offline gate page',
      'offline PIN shell',
      'slow 3G dashboard2 PIN load',
      'API timeout retry',
      '500+ transaction render',
      'memory on long scroll',
      'rotate during PIN entry',
      'rotate during transfer modal',
      'low battery mode throttling',
      'service worker cache hit',
      'push permission prompt',
      'duplicate payment submit',
      'stale balance after payment',
      'concurrent tab logout via payment-orders',
      'deep link /dashboard/payment-orders',
      'deep link dashboardpayment',
      'site gate wrong password',
      'site gate empty password',
      'PIN screen after hard refresh',
      'PWA standalone viewport',
    ],
  },
]

function buildCases(spec: SuiteSpec) {
  const cases: { id: string; title: string; topic: string }[] = []
  for (let i = 0; i < spec.count; i++) {
    const topic = spec.topics[i % spec.topics.length]
    const variant = Math.floor(i / spec.topics.length) + 1
    const id = `${spec.file.replace('.spec.ts', '')}-${String(i + 1).padStart(3, '0')}`
    const title =
      variant > 1
        ? `${topic} (variant ${variant})`
        : topic
    cases.push({ id, title, topic })
  }
  return cases
}

function renderSpec(spec: SuiteSpec) {
  const cases = buildCases(spec)
  const caseLines = cases
    .map(
      (c) =>
        `  test.skip('${c.id}: ${c.title.replace(/'/g, "\\'")}', async () => {
    // Scaffold – implement when ${spec.suite.split('–')[1]?.trim() ?? spec.suite} is finalized.
    // Topic: ${c.topic}
  })`
    )
    .join('\n\n')

  return `import { test } from '@playwright/test'

test.describe('${spec.suite}', () => {
${caseLines}
})
`
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  let total = 0
  for (const spec of SUITES) {
    const content = renderSpec(spec)
    fs.writeFileSync(path.join(OUT_DIR, spec.file), content, 'utf8')
    total += spec.count
    console.log(`✓ ${spec.file} (${spec.count} tests)`)
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'README.md'),
    `# Shared iPhone E2E

Hand-maintained (never overwritten by this script):

- \`auth.spec.ts\` — guest → PIN → Prehľad via \`loginWithPin\`
- \`dashboard.spec.ts\` — full-bleed Prehľad; classic Menu/Odhlás on \`/dashboard/payment-orders\`

${total} skipped scaffold tests below for projects **iPhone 15+** (\`e2e/iphone/\`).

Run:

\`\`\`bash
npm run test:iphone
\`\`\`

Regenerate scaffolds only (auth/dashboard are excluded):

\`\`\`bash
npx tsx scripts/generate-iphone-tests.ts
\`\`\`

| File | Tests | Focus |
|------|------:|-------|
| auth.spec.ts | hand | Auth + PIN |
| dashboard.spec.ts | hand | Dashboard2 full-bleed |
${SUITES.map((s) => `| ${s.file} | ${s.count} | ${s.suite.split('–')[1]?.trim() ?? s.suite} |`).join('\n')}
`,
    'utf8'
  )

  console.log(`\n🎉 Generated ${total} scaffold tests in e2e/iphone/`)
}

main()
