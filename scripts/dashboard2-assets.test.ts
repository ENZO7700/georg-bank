/**
 * Lightweight unit checks for agent-delivered dashboard2 assets.
 * Run: npx tsx scripts/dashboard2-assets.test.ts
 */
import fs from 'fs'
import path from 'path'

const root = path.join(__dirname, '..')
let failed = 0

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error('✗', msg)
    failed++
  } else {
    console.log('✓', msg)
  }
}

// proxy.ts (Next 16) – not middleware.ts
assert(fs.existsSync(path.join(root, 'proxy.ts')), 'proxy.ts exists')
assert(!fs.existsSync(path.join(root, 'middleware.ts')), 'middleware.ts removed (use proxy)')

const proxySrc = fs.readFileSync(path.join(root, 'proxy.ts'), 'utf8')
assert(/export function proxy\(/.test(proxySrc), 'proxy.ts exports function proxy')
assert(!/export function middleware\(/.test(proxySrc), 'proxy.ts does not export middleware')

// Face models
const modelsDir = path.join(root, 'public/models')
const manifest = path.join(modelsDir, 'tiny_face_detector_model-weights_manifest.json')
const shard = path.join(modelsDir, 'tiny_face_detector_model-shard1')
assert(fs.existsSync(manifest), 'tiny_face_detector manifest exists')
assert(fs.existsSync(shard), 'tiny_face_detector shard exists')
assert(fs.statSync(shard).size > 10_000, 'shard size is non-trivial')

// dashboard2 contains Face ID wiring
const page = fs.readFileSync(path.join(root, 'app/dashboard2/page.tsx'), 'utf8')
assert(page.includes('triggerBiometrics'), 'dashboard2 has triggerBiometrics')
assert(page.includes('loadFromUri'), 'dashboard2 loads face models')
assert(page.includes('tf.ready') || page.includes('ensureTfReady'), 'dashboard2 waits for tf backend')
assert(
  !/setIsPasscodeScreen\(true\)\s*\n\s*triggerBiometrics\(/.test(page),
  'Prihlásiť sa does not auto-call triggerBiometrics'
)
assert(
  !page.includes("showToast('Úspešne prihlásený!')"),
  'PIN success toast removed'
)

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll dashboard2 asset checks passed.')
