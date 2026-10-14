-- Historial de pagos de suscripción registrados manualmente por la plataforma.
-- Correr en Railway (psql $DATABASE_URL) ANTES de desplegar el backend.
CREATE TABLE IF NOT EXISTS "CompanyPayment" (
  "id"            SERIAL PRIMARY KEY,
  "companyId"     INTEGER NOT NULL,
  "months"        INTEGER NOT NULL,
  "unitPrice"     INTEGER NOT NULL,
  "gross"         INTEGER NOT NULL,
  "discountType"  TEXT,
  "discountValue" INTEGER NOT NULL DEFAULT 0,
  "amount"        INTEGER NOT NULL,
  "method"        TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
  "note"          TEXT,
  "paidAt"        TIMESTAMP(3) NOT NULL,
  "periodFrom"    TIMESTAMP(3),
  "periodTo"      TIMESTAMP(3) NOT NULL,
  "registeredBy"  INTEGER,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CompanyPayment_companyId_idx" ON "CompanyPayment"("companyId");
