-- Consignaciones por local: cada sede tiene su propio token (cuenta/SMS) y cada
-- consignación queda asociada a su local. El token de empresa sigue como respaldo.

-- 1) BankDeposit.localId (sede de la consignación; null = token de empresa / antiguas)
ALTER TABLE "BankDeposit" ADD COLUMN IF NOT EXISTS "localId" INTEGER;

-- 2) Config de aviso por local
CREATE TABLE IF NOT EXISTS "LocalBankNotify" (
    "id" SERIAL NOT NULL,
    "localId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocalBankNotify_pkey" PRIMARY KEY ("id")
);

-- 3) Índices
CREATE INDEX IF NOT EXISTS "BankDeposit_localId_idx" ON "BankDeposit"("localId");
CREATE UNIQUE INDEX IF NOT EXISTS "LocalBankNotify_localId_key" ON "LocalBankNotify"("localId");
CREATE UNIQUE INDEX IF NOT EXISTS "LocalBankNotify_token_key" ON "LocalBankNotify"("token");
CREATE INDEX IF NOT EXISTS "LocalBankNotify_companyId_idx" ON "LocalBankNotify"("companyId");

-- 4) Llaves foráneas (idempotentes)
DO $$ BEGIN
    ALTER TABLE "BankDeposit" ADD CONSTRAINT "BankDeposit_localId_fkey"
        FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "LocalBankNotify" ADD CONSTRAINT "LocalBankNotify_localId_fkey"
        FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "LocalBankNotify" ADD CONSTRAINT "LocalBankNotify_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
