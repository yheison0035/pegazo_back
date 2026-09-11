-- Contabilidad · Fase B1: plan de cuentas (PUC simplificado) por empresa.
CREATE TABLE IF NOT EXISTS "LedgerAccount" (
  "id"        SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "code"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "nature"    TEXT NOT NULL,
  "isBase"    BOOLEAN NOT NULL DEFAULT false,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerAccount_companyId_fkey" FOREIGN KEY ("companyId")
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "LedgerAccount_companyId_code_key"
  ON "LedgerAccount"("companyId", "code");
CREATE INDEX IF NOT EXISTS "LedgerAccount_companyId_idx"
  ON "LedgerAccount"("companyId");
