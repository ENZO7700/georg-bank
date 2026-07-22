import * as dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'
import { resolveDatabaseUrl } from './lib/db/resolve-database-url'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: resolveDatabaseUrl() || 'postgresql://postgres:postgres@127.0.0.1:5432/internet_bank',
  },
} satisfies Config
