-- Préstamos · fase 2 (aditivo e idempotente):
--   - Loan.reminderSentAt: antispam del recordatorio de cuota al cliente.
--   - User.commissionCollectionRate: % de comisión del cobrador sobre recaudo.
--   npx prisma db execute --file prisma/migrations/20261120130000_prestamos_fase2/migration.sql --schema prisma/schema.prisma
ALTER TABLE "Loan" ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "commissionCollectionRate" DECIMAL(5,2);
