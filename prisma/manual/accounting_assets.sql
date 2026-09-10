-- Contabilidad · Fase A: activos fijos + interruptor de la sección.

ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "accountingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "Asset" (
  "id"               SERIAL PRIMARY KEY,
  "companyId"        INTEGER NOT NULL,
  "localId"          INTEGER,
  "name"             TEXT NOT NULL,
  "category"         TEXT,
  "reference"        TEXT,
  "acquisitionDate"  TIMESTAMP(3) NOT NULL,
  "cost"             INTEGER NOT NULL,
  "salvageValue"     INTEGER NOT NULL DEFAULT 0,
  "usefulLifeMonths" INTEGER NOT NULL,
  "method"           TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
  "status"           TEXT NOT NULL DEFAULT 'ACTIVE',
  "disposalDate"     TIMESTAMP(3),
  "disposalValue"    INTEGER,
  "notes"            TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Asset_companyId_fkey" FOREIGN KEY ("companyId")
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Asset_companyId_idx" ON "Asset"("companyId");
CREATE INDEX IF NOT EXISTS "Asset_companyId_status_idx" ON "Asset"("companyId", "status");
