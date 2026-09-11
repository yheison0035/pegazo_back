-- Fase E1: calendario tributario configurable (plataforma) + parámetros (UVT).
CREATE TABLE IF NOT EXISTS "TaxDeadline" (
  "id"         SERIAL PRIMARY KEY,
  "year"       INTEGER NOT NULL,
  "obligation" TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "period"     TEXT,
  "dueDate"    TIMESTAMP(3) NOT NULL,
  "nitDigits"  TEXT,
  "regime"     TEXT,
  "notes"      TEXT,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "TaxDeadline_year_idx" ON "TaxDeadline"("year");

CREATE TABLE IF NOT EXISTS "TaxParameter" (
  "id"        SERIAL PRIMARY KEY,
  "key"       TEXT NOT NULL,
  "year"      INTEGER NOT NULL,
  "value"     INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "TaxParameter_key_year_key" ON "TaxParameter"("key", "year");
