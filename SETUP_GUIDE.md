# 🚀 Internet Bank PWA - Complete Setup Guide

This guide will help you set up the entire project from scratch, fixing all errors and configuring everything properly.

---

## 📋 Prerequisites

### 1. Install PostgreSQL

**macOS (Recommended):**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create the database
createdb internet_bank
```

**Windows:**
- Download and install PostgreSQL from: https://www.postgresql.org/download/windows/
- During installation, note down the password you set for the `postgres` user
- Create a database named `internet_bank` using pgAdmin or command line

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb internet_bank
```

---

## 🔧 Configuration

### 2. Update Environment Variables

Edit `.env.local` in the project root:

```env
# Database URL - UPDATE THESE VALUES IF DIFFERENT
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/internet_bank"

# Better Auth Configuration
BETTER_AUTH_URL="http://localhost:3030"
BETTER_AUTH_SECRET="local_testing_secret_key_987654321"

# Local Testing Dev Credentials
NEXT_PUBLIC_DEV_USER_EMAIL="admin"
NEXT_PUBLIC_DEV_USER_PASSWORD="admin"

# Super Admin Configuration
SUPER_ADMIN_EMAIL="admin@admin.com"
SUPER_ADMIN_PASSWORD="admin@admin.com"

# Web Push VAPID Keys (already configured)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BMP8nnsS2bTs4MbHs3AvNEgD6nWwuAOEVEq5pXog2SdMv4M3o9Z3A23_miGDxUyxZwKdJYREt8TkCFph8QVhok4"
VAPID_PRIVATE_KEY="xQPvqKs8JoBKRuuKdrjk86MwJyjjvpCnEzabRx0yEkY"
VAPID_SUBJECT="mailto:admin@internetbank.sk"

# Mistral AI
MISTRAL_API_KEY="niqhZpPlrTrh8SlXY9RiJ00rxdYe5qkL"

# Vercel (optional)
VERCEL_OIDC_TOKEN="your_token_here"
```

**If your PostgreSQL has different credentials, update the `DATABASE_URL`:**
- Format: `postgresql://username:password@localhost:5432/database_name`
- Example: `postgresql://myuser:mypassword@localhost:5432/internet_bank`

---

## 🛠️ Database Setup

### 3. Install Dependencies

```bash
# Install all dependencies
npm install

# Install drizzle-kit globally (optional but recommended)
npm install -g drizzle-kit
```

### 4. Run Database Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

**Alternative (combined command):**
```bash
npx drizzle-kit generate:pg && npx drizzle-kit migrate
```

---

## 🌱 Seed the Database

### 5. Create Admin Users

```bash
npm run db:seed
```

This will create the following users:
- `admin@internetbank.sk` / `admin123`
- `admin1@internetbank.sk` / `admin123`
- `admin2@internetbank.sk` / `admin2123`

**Note:** The seed script will:
- Wait for the database to be ready
- Check if tables exist (error if migrations not run)
- Skip users that already exist
- Provide helpful error messages if something goes wrong

---

## ✅ Verify Everything Works

### 6. Start the Development Server

```bash
npm run dev
```

The app should start on `http://localhost:3030`

### 7. Test Database Connection

You can test if the database is working by:

1. **Using the seed script again** (should skip existing users):
   ```bash
   npm run db:seed
   ```

2. **Connect directly with psql:**
   ```bash
   psql -U postgres -d internet_bank
   ```
   Then run:
   ```sql
   SELECT * FROM "user";
   SELECT * FROM bank_account;
   ```

---

## 🧪 Run Tests

### 8. Execute Playwright Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/pwa.spec.ts

# Open test report
npx playwright show-report
```

---

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed database with users |
| `npm run db:reset` | Reset database (migrate + seed) |
| `npm run db:studio` | Open Drizzle Studio (GUI) |
| `npx playwright test` | Run all tests |
| `npx playwright test e2e/pwa.spec.ts` | Run specific test |

---

## ⚠️ Troubleshooting

### Common Issues & Solutions

#### 1. PostgreSQL Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql

# Or manually
pg_ctl -D /usr/local/var/postgres start
```

#### 2. Authentication Failed / Password Issues

**Error:** `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

**Solution:**
- Check your `.env.local` file for correct database credentials
- Update `DATABASE_URL` to match your PostgreSQL username/password
- Example: `postgresql://myuser:mypassword@localhost:5432/internet_bank`

#### 3. Relation "user" Does Not Exist

**Error:** `[Better Auth] ERROR relation "user" does not exist`

**Solution:**
```bash
# Run migrations first
npm run db:generate
npm run db:migrate

# Then seed
npm run db:seed
```

#### 4. Drizzle Kit Not Found

**Error:** `command not found: drizzle-kit`

**Solution:**
```bash
# Install locally
npm install --save-dev drizzle-kit

# Or use npx
npx drizzle-kit generate:pg
```

#### 5. Playwright Tests Failing

**Error:** Tests timeout or fail to navigate

**Solution:**
```bash
# Make sure app is running in one terminal
npm run dev

# In another terminal, run tests
npx playwright test

# Or run with UI mode
npx playwright test --ui
```

---

## 📚 Project Structure

```
📁 internet-bank-pwa-main/
├── 📁 app/                    # Next.js app directory
├── 📁 components/             # React components
├── 📁 lib/                    # Utility libraries
│   ├── 📁 db/                 # Database configuration
│   │   ├── index.ts           # Drizzle pool setup
│   │   └── schema.ts          # Database schema definitions
│   └── auth.ts                # Better Auth configuration
├── 📁 scripts/                # Utility scripts
│   ├── seed-users.ts          # Database seeding script
│   └── setup-database.sh      # PostgreSQL setup helper
├── 📁 e2e/                   # Playwright end-to-end tests
├── drizzle.config.ts          # Drizzle Kit configuration
├── .env.local                 # Local environment variables
├── .env                      # Base environment variables
└── package.json
```

---

## 🎯 Quick Start (Summary)

```bash
# 1. Install PostgreSQL and start it
brew install postgresql
brew services start postgresql
createdb internet_bank

# 2. Install dependencies
npm install

# 3. Run migrations and seed
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start the app
npm run dev

# 5. Run tests
npx playwright test
```

---

## 🔄 Reset Everything

If you want to start fresh:

```bash
# Drop database
psql -U postgres -c "DROP DATABASE IF EXISTS internet_bank;"

# Create new database
createdb internet_bank

# Run migrations and seed
npm run db:reset

# Or manually
npm run db:migrate
npm run db:seed
```

---

## 📞 Support

If you encounter any issues not covered in this guide:

1. **Check the error message** - It usually tells you exactly what's wrong
2. **Verify PostgreSQL is running** - `brew services list | grep postgresql`
3. **Test connection manually** - `psql -U postgres -d internet_bank`
4. **Check environment variables** - `cat .env.local | grep DATABASE_URL`
5. **Clear node_modules and reinstall** - `rm -rf node_modules && npm install`

---

**Last Updated:** June 23, 2026
