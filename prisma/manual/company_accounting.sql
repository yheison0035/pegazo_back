-- Base contable + cierre de periodo por empresa. Correr en Railway:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/manual/company_accounting.sql
-- Idempotente.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "accountingBasis" TEXT NOT NULL DEFAULT 'CASH';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "booksClosedUntil" TIMESTAMP(3);
