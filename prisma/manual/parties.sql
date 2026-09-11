-- Terceros contables (clientes/proveedores/empleados) por empresa.
CREATE TABLE IF NOT EXISTS "Party" (
  "id"        SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "kind"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "docType"   TEXT,
  "docNumber" TEXT,
  "email"     TEXT,
  "phone"     TEXT,
  "address"   TEXT,
  "notes"     TEXT,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Party_companyId_fkey" FOREIGN KEY ("companyId")
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Party_companyId_kind_idx" ON "Party"("companyId", "kind");
