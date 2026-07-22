-- Supabase PostgreSQL Schema for George Dev project
-- Run this in your Supabase SQL Editor to initialize the tables.

-- Disable row-level security by default or configure as needed (RLS policies are recommended for production)
-- Enable extensions if needed

-- 1. User table
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Bank Account table
CREATE TABLE IF NOT EXISTS "bank_account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL UNIQUE,
  "accountType" TEXT NOT NULL, -- 'checking', 'savings'
  "balance" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_bank_account_userId" ON "bank_account" ("userId");

-- 3. Transaction table
CREATE TABLE IF NOT EXISTS "transaction" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "fromAccountId" TEXT,
  "toAccountId" TEXT,
  "amount" INTEGER NOT NULL,
  "balanceBefore" INTEGER,
  "balanceAfter" INTEGER,
  "type" TEXT NOT NULL, -- 'transfer', 'deposit', 'withdrawal'
  "description" TEXT,
  "pdfUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_transaction_userId" ON "transaction" ("userId");
CREATE INDEX IF NOT EXISTS "idx_transaction_createdAt" ON "transaction" ("createdAt");

-- 4. Push Subscription table
CREATE TABLE IF NOT EXISTS "push_subscription" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
