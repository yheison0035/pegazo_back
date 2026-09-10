-- Chat de soporte (negocio <-> plataforma). Correr en Railway:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/manual/support_message.sql
-- Idempotente.
CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id"             SERIAL       PRIMARY KEY,
  "companyId"      INTEGER      NOT NULL,
  "fromPlatform"   BOOLEAN      NOT NULL DEFAULT false,
  "senderUserId"   INTEGER,
  "senderName"     TEXT         NOT NULL,
  "body"           TEXT         NOT NULL,
  "readByPlatform" BOOLEAN      NOT NULL DEFAULT false,
  "readByClient"   BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SupportMessage_companyId_createdAt_idx"
  ON "SupportMessage" ("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportMessage_readByPlatform_idx"
  ON "SupportMessage" ("readByPlatform");
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportMessage_companyId_fkey') THEN
    ALTER TABLE "SupportMessage"
      ADD CONSTRAINT "SupportMessage_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
