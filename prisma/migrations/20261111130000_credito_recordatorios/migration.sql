-- Recordatorios de crédito (fiado) por correo al cliente.
-- Interruptor global por empresa + días de antelación, y marca de última vez
-- que se recordó cada venta a crédito (para no repetir el aviso a diario).
-- Idempotente: se puede correr varias veces sin romper nada.

ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "creditRemindersEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "creditReminderDaysBefore" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Sale"
  ADD COLUMN IF NOT EXISTS "creditReminderSentAt" TIMESTAMP(3);
