-- Día de pago del mes por empresa (1-31). Correr en Railway:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/manual/company_payment_day.sql
-- Idempotente.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "paymentDay" INTEGER;
