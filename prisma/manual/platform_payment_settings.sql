-- Cuentas de pago de la plataforma (config global única).
-- Correr en la consola de Railway:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/manual/platform_payment_settings.sql
-- Idempotente.

CREATE TABLE IF NOT EXISTS "PlatformPaymentSettings" (
  "id"             INTEGER      PRIMARY KEY DEFAULT 1,
  "bankName"       TEXT         NOT NULL DEFAULT 'BANCOLOMBIA',
  "accountType"    TEXT         NOT NULL DEFAULT 'AHORROS',
  "accountNumber"  TEXT         NOT NULL DEFAULT '',
  "accountHolder"  TEXT         NOT NULL DEFAULT '',
  "whatsappNumber" TEXT         NOT NULL DEFAULT '',
  "instructions"   TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Semilla con los datos actuales (solo si no existe la fila 1).
INSERT INTO "PlatformPaymentSettings"
  ("id","bankName","accountType","accountNumber","accountHolder","whatsappNumber","updatedAt")
VALUES
  (1,'BANCOLOMBIA','AHORROS','45544431912','YEISON ANDRES SUAREZ DIAZ','3186356609',CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
