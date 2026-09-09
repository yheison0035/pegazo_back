-- Solicitudes de disminución de stock (aprobación dueño/admin).
-- Correr en la consola de Railway:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/manual/stock_change_request.sql
-- Idempotente: se puede correr varias veces sin romper.

CREATE TABLE IF NOT EXISTS "StockChangeRequest" (
  "id"            SERIAL       PRIMARY KEY,
  "companyId"     INTEGER      NOT NULL,
  "inventoryId"   INTEGER      NOT NULL,
  "status"        TEXT         NOT NULL DEFAULT 'PENDING',
  "reason"        TEXT         NOT NULL,
  "decisionNote"  TEXT,
  "lines"         JSONB        NOT NULL,
  "seen"          BOOLEAN      NOT NULL DEFAULT false,
  "requestedById" INTEGER      NOT NULL,
  "decidedById"   INTEGER,
  "decidedAt"     TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "StockChangeRequest_companyId_status_idx"
  ON "StockChangeRequest" ("companyId", "status");
CREATE INDEX IF NOT EXISTS "StockChangeRequest_inventoryId_status_idx"
  ON "StockChangeRequest" ("inventoryId", "status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockChangeRequest_companyId_fkey') THEN
    ALTER TABLE "StockChangeRequest"
      ADD CONSTRAINT "StockChangeRequest_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockChangeRequest_inventoryId_fkey') THEN
    ALTER TABLE "StockChangeRequest"
      ADD CONSTRAINT "StockChangeRequest_inventoryId_fkey"
      FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockChangeRequest_requestedById_fkey') THEN
    ALTER TABLE "StockChangeRequest"
      ADD CONSTRAINT "StockChangeRequest_requestedById_fkey"
      FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StockChangeRequest_decidedById_fkey') THEN
    ALTER TABLE "StockChangeRequest"
      ADD CONSTRAINT "StockChangeRequest_decidedById_fkey"
      FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
