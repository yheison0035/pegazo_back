-- GUARDA CASCOS: configuración de tarifas + tickets de custodia.
CREATE TABLE IF NOT EXISTS "StorageSettings" (
  "id" SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL UNIQUE,
  "hourRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "washPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "graceMinutes" INTEGER NOT NULL DEFAULT 0,
  "defaultMode" TEXT NOT NULL DEFAULT 'HORA',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "StorageTicket" (
  "id" SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "localId" INTEGER NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "customerEmail" TEXT,
  "customerId" INTEGER,
  "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkOutAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'EN_CUSTODIA',
  "billingMode" TEXT NOT NULL DEFAULT 'HORA',
  "helmetCount" INTEGER NOT NULL DEFAULT 1,
  "washRequested" BOOLEAN NOT NULL DEFAULT false,
  "washCount" INTEGER NOT NULL DEFAULT 0,
  "washDone" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "amount" DOUBLE PRECISION,
  "saleId" INTEGER,
  "userId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Por si la tabla ya existía sin washCount:
ALTER TABLE "StorageTicket" ADD COLUMN IF NOT EXISTS "washCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "StorageTicket_companyId_idx" ON "StorageTicket"("companyId");
CREATE INDEX IF NOT EXISTS "StorageTicket_localId_idx" ON "StorageTicket"("localId");
CREATE INDEX IF NOT EXISTS "StorageTicket_status_idx" ON "StorageTicket"("status");
DO $$ BEGIN
  ALTER TABLE "StorageTicket" ADD CONSTRAINT "StorageTicket_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
