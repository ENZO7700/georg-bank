import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { resolveDatabaseUrl } from '../lib/db/resolve-database-url'
import {
  GUEST_USER_EMAIL,
  GUEST_USER_NAME,
  GUEST_USER_PASSWORD,
} from '../lib/guest-auth'

function buildPool() {
  const rawUrl = resolveDatabaseUrl()
  if (!rawUrl) {
    console.warn('[ensure-db] No database URL configured, skipping.')
    return null
  }

  const hasSsl = rawUrl.includes('sslmode=')
  const connectionString = rawUrl
    .replace(/[?&]sslmode=[^&]*/g, '')
    .replace(/\?$/, '')

  return new Pool({
    connectionString,
    ssl: hasSsl ? { rejectUnauthorized: false } : undefined,
  })
}

async function tableExists(pool: Pool, tableName: string) {
  const result = await pool.query(
    `SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = $1 LIMIT 1`,
    [tableName]
  )
  return result.rows.length > 0
}

async function applySqlFile(pool: Pool, filePath: string) {
  const sql = fs.readFileSync(filePath, 'utf8')
  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await pool.query(statement)
  }
}

async function ensureSchema(pool: Pool) {
  if (await tableExists(pool, 'user')) {
    console.log('[ensure-db] Schema already present.')
    return
  }

  console.log('[ensure-db] Applying base schema...')
  await applySqlFile(
    pool,
    path.join(process.cwd(), 'drizzle', 'supabase_apply_0000.sql')
  )

  const migrationPath = path.join(
    process.cwd(),
    'drizzle',
    '0001_account_display_name.sql'
  )
  if (fs.existsSync(migrationPath)) {
    await applySqlFile(pool, migrationPath)
  }

  console.log('[ensure-db] Schema applied.')
}

async function ensureGuestUser(pool: Pool) {
  const existing = await pool.query(
    'SELECT 1 FROM "user" WHERE email = $1 LIMIT 1',
    [GUEST_USER_EMAIL]
  )

  if (existing.rows.length > 0) {
    console.log('[ensure-db] Guest user already exists.')
    return
  }

  const { auth } = await import('../lib/auth')
  await auth.api.signUpEmail({
    body: {
      email: GUEST_USER_EMAIL,
      password: GUEST_USER_PASSWORD,
      name: GUEST_USER_NAME,
    },
  })
  console.log('[ensure-db] Guest user created.')
}

/** Demo account used by dashboard2 payments (user-filip-default). Keep funded for CI. */
async function ensureDemoAccountBalance(pool: Pool) {
  if (!(await tableExists(pool, 'bank_account'))) {
    console.log('[ensure-db] bank_account table missing, skip demo balance seed.')
    return
  }

  const SEED_CENTS = 10_000 // €100
  const defaultUserId = 'user-filip-default'

  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, 'Filip', 'filip@example.com', true, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [defaultUserId]
  )

  const existing = await pool.query(
    `SELECT id, balance FROM "bank_account" WHERE "userId" = $1 LIMIT 1`,
    [defaultUserId]
  )

  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO "bank_account" (
         id, "userId", "accountNumber", "displayName", "accountType",
         balance, currency, "isActive", "createdAt", "updatedAt"
       ) VALUES ($1, $2, 'SK3109000000005012345678', 'Osobný účet', 'checking', $3, 'EUR', true, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      ['acc-demo-default', defaultUserId, SEED_CENTS]
    )
    console.log('[ensure-db] Demo bank account seeded with €100.')
    return
  }

  const current = Number(existing.rows[0].balance ?? 0)
  if (current < SEED_CENTS) {
    await pool.query(
      `UPDATE "bank_account" SET balance = $1, "updatedAt" = NOW() WHERE id = $2`,
      [SEED_CENTS, existing.rows[0].id]
    )
    console.log(`[ensure-db] Demo account topped up ${current} → ${SEED_CENTS} cents.`)
  } else {
    console.log('[ensure-db] Demo account balance OK.')
  }
}

export async function ensureDatabase() {
  const pool = buildPool()
  if (!pool) return

  try {
    await pool.query('SELECT 1')
    await ensureSchema(pool)
    await ensureGuestUser(pool)
    await ensureDemoAccountBalance(pool)
  } finally {
    await pool.end()
  }
}

async function main() {
  try {
    await ensureDatabase()
  } catch (error) {
    if (process.env.VERCEL === '1') {
      throw error
    }
    console.warn(
      '[ensure-db] Skipping database setup:',
      error instanceof Error ? error.message : error
    )
  }
}

if (process.argv[1]?.includes('ensure-db')) {
  main().catch((error) => {
    console.error('[ensure-db] Failed:', error)
    process.exit(1)
  })
}