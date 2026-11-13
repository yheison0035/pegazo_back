-- Marca de auto-registro: true = la empresa se registró sola por /register.
-- Las existentes y las creadas por la plataforma quedan en false (entran directo).
ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "selfRegistered" BOOLEAN NOT NULL DEFAULT false;
