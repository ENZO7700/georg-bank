/**
 * Prints the Supabase DATABASE_URL template for .env.local
 * Run: npx tsx --env-file=.env.local scripts/setup-supabase-env.ts
 *
 * Set SUPABASE_DB_PASSWORD in .env.local (Supabase Dashboard → Project Settings → Database)
 */
import '../lib/env'
import { resolveDatabaseUrl } from '../lib/db/resolve-database-url'
import fs from 'fs'

const url = resolveDatabaseUrl()
if (!url) {
  console.error('❌ Cannot build Supabase DATABASE_URL.')
  console.error('   Add to .env.local:')
  console.error('   SUPABASE_DB_PASSWORD=<your-db-password-from-supabase-dashboard>')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://stdynpjfetsomrkivosg.supabase.co')
  process.exit(1)
}

const masked = url.replace(/:([^:@/]+)@/, ':***@')
console.log('✅ Supabase DATABASE_URL resolved:')
console.log(masked)

// Optional: write DATABASE_URL line into .env.local (keep other vars)
const envPath = '.env.local'
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const newLine = `DATABASE_URL="${url}"`

if (/^DATABASE_URL=/m.test(content)) {
  content = content.replace(/^DATABASE_URL=.*$/m, newLine)
} else {
  content += `\n${newLine}\n`
}

fs.writeFileSync(envPath, content)
console.log(`✅ Updated ${envPath} with Supabase DATABASE_URL`)
