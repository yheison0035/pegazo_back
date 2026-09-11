-- Fase H2: asientos contables manuales (partida doble).
CREATE TABLE IF NOT EXISTS "JournalEntry" (
  "id"                    SERIAL PRIMARY KEY,
  "companyId"             INTEGER NOT NULL,
  "date"                  TIMESTAMP(3) NOT NULL,
  "description"           TEXT NOT NULL,
  "reference"             TEXT,
  "createdByAccountantId" INTEGER,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId")
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "JournalEntry_companyId_date_idx" ON "JournalEntry"("companyId", "date");

CREATE TABLE IF NOT EXISTS "JournalEntryLine" (
  "id"          SERIAL PRIMARY KEY,
  "entryId"     INTEGER NOT NULL,
  "accountCode" TEXT NOT NULL,
  "accountName" TEXT,
  "debit"       INTEGER NOT NULL DEFAULT 0,
  "credit"      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "JournalEntryLine_entryId_fkey" FOREIGN KEY ("entryId")
    REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "JournalEntryLine_entryId_idx" ON "JournalEntryLine"("entryId");
