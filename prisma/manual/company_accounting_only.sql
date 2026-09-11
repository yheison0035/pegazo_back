-- Fase H1: empresas "solo contabilidad" creadas por el contador.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "accountingOnly" BOOLEAN NOT NULL DEFAULT false;
