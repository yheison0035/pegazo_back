-- Fase 2-3 contabilidad (29/10/2026): retenciones en compras/gastos, retenciones a
-- favor y anticipo de renta por año, e identificación tributaria del proveedor.
-- Idempotente. Correr en la BD de producción ANTES de desplegar el backend.
ALTER TABLE "Purchase"        ADD COLUMN IF NOT EXISTS "retefuente"        DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Purchase"        ADD COLUMN IF NOT EXISTS "reteica"           DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Expense"         ADD COLUMN IF NOT EXISTS "retefuente"        DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Expense"         ADD COLUMN IF NOT EXISTS "reteica"           DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CompanyTaxYear"  ADD COLUMN IF NOT EXISTS "retencionesAFavor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CompanyTaxYear"  ADD COLUMN IF NOT EXISTS "anticipoRenta"     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Provider"        ADD COLUMN IF NOT EXISTS "docType"           TEXT;
ALTER TABLE "Provider"        ADD COLUMN IF NOT EXISTS "docNumber"         TEXT;
