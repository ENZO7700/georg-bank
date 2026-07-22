/* eslint-disable @typescript-eslint/no-explicit-any */
import '../lib/env'
import { auth } from '../lib/auth'
import { pool } from '../lib/db'

async function waitForDatabase() {
  console.log(`Debug - DATABASE_URL is: "${process.env.DATABASE_URL}"`)
  const maxRetries = 10
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect()
      await client.query('SELECT 1')
      client.release()
      console.log('✓ Database connected successfully')
      return
    } catch (e: any) {
      console.log(`⏳ Waiting for database (attempt ${i + 1}/${maxRetries})... Error: ${e.message}`)
      if (e.message.includes('relation "user" does not exist')) {
        console.log('⚠️  Database tables do not exist. Please run migrations first.')
        console.log('   Run: npx drizzle-kit generate:pg && npx drizzle-kit migrate')
        process.exit(1)
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  throw new Error('❌ Could not connect to database after multiple attempts')
}

async function seed() {
  console.log('🌱 Starting database seeding...\n')
  
  try {
    await waitForDatabase()
    
    // Check if user table exists
    try {
      await pool.query('SELECT 1 FROM "user" LIMIT 1')
      console.log('✓ User table exists\n')
    } catch (e: any) {
      if (e.message.includes('relation "user" does not exist')) {
        console.error('❌ ERROR: User table does not exist!')
        console.error('   You must run database migrations first:')
        console.error('   1. npx drizzle-kit generate:pg')
        console.error('   2. npx drizzle-kit migrate')
        console.error('\nThen run this seed script again.')
        process.exit(1)
      }
      throw e
    }

    const users = [
      { email: process.env.SUPER_ADMIN_EMAIL ?? 'larsenevans@proton.me', password: process.env.SUPER_ADMIN_PASSWORD ?? 'admin', name: 'Larsen Evans' },
      { email: 'admin@internetbank.sk', password: 'admin123', name: 'Admin' },
      { email: 'admin1@internetbank.sk', password: 'admin123', name: 'Admin 1' },
      { email: 'admin2@internetbank.sk', password: 'admin2123', name: 'Admin 2' }
    ]

    console.log('📧 Seeding database with requested logins...\n')

    for (const user of users) {
      try {
        console.log(`👤 Creating user: ${user.email} ...`)
        
        // Check if user already exists by querying DB directly
        const res = await pool.query('SELECT 1 FROM "user" WHERE email = $1', [user.email])
        
        if (res.rows.length > 0) {
          console.log(`   ⚡ User ${user.email} already exists, skipping.`)
          continue
        }
        
        // Create new user
        await auth.api.signUpEmail({
          body: {
            email: user.email,
            password: user.password,
            name: user.name,
          }
        })
        
        console.log(`   ✅ User ${user.email} created successfully.`)
      } catch (e: any) {
        console.error(`   ❌ Error creating ${user.email}:`)
        console.error(`      ${e.message}`)
        
        // Handle specific PostgreSQL errors
        if (e.message.includes('SASL') || e.message.includes('password must be a string')) {
          console.error('\n💡 TIP: Check your DATABASE_URL in .env.local')
          console.error('   It should be: postgresql://username:password@localhost:5432/internet_bank')
          console.error('   Make sure PostgreSQL is running: brew services start postgresql')
        }
      }
    }

    console.log('\n✅ Seeding finished successfully. Exiting...')
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Seeding failed with error:')
    console.error(error.message)
    process.exit(1)
  }
}

seed()
