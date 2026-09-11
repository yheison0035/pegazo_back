-- Bloque 3 · G1: identidad del contador (independiente) + enlace a empresas.
CREATE TABLE IF NOT EXISTS "Accountant" (
  "id"            SERIAL PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "email"         TEXT NOT NULL,
  "password"      TEXT NOT NULL,
  "phone"         TEXT,
  "accountantKey" TEXT NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'ACTIVO',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Accountant_email_key" ON "Accountant"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Accountant_accountantKey_key" ON "Accountant"("accountantKey");

CREATE TABLE IF NOT EXISTS "AccountantCompany" (
  "id"           SERIAL PRIMARY KEY,
  "accountantId" INTEGER NOT NULL,
  "companyId"    INTEGER NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountantCompany_accountantId_fkey" FOREIGN KEY ("accountantId")
    REFERENCES "Accountant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccountantCompany_companyId_fkey" FOREIGN KEY ("companyId")
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AccountantCompany_accountantId_companyId_key"
  ON "AccountantCompany"("accountantId", "companyId");
CREATE INDEX IF NOT EXISTS "AccountantCompany_accountantId_idx" ON "AccountantCompany"("accountantId");
CREATE INDEX IF NOT EXISTS "AccountantCompany_companyId_idx" ON "AccountantCompany"("companyId");
