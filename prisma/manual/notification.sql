-- Notificaciones in-app por usuario (campana, leído/no leído).
-- Correr en la consola de Railway:
--   npx prisma db execute --schema prisma/schema.prisma --file prisma/manual/notification.sql
-- Idempotente.

CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        SERIAL       PRIMARY KEY,
  "companyId" INTEGER      NOT NULL,
  "userId"    INTEGER      NOT NULL,
  "type"      TEXT         NOT NULL,
  "title"     TEXT         NOT NULL,
  "body"      TEXT         NOT NULL,
  "url"       TEXT,
  "data"      JSONB,
  "read"      BOOLEAN      NOT NULL DEFAULT false,
  "readAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx"
  ON "Notification" ("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_companyId_idx"
  ON "Notification" ("companyId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_companyId_fkey') THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
