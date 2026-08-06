ALTER TABLE "bank_account" ADD COLUMN IF NOT EXISTS "productLabel" text;
ALTER TABLE "bank_account" ADD COLUMN IF NOT EXISTS "holderAddressLine1" text;
ALTER TABLE "bank_account" ADD COLUMN IF NOT EXISTS "holderAddressLine2" text;
ALTER TABLE "bank_account" ADD COLUMN IF NOT EXISTS "holderAddressLine3" text;
