-- Apariencia del panel POR LOCAL (color y tipografía). Null = hereda la de la
-- empresa. Cada sede es independiente. Aditivo e idempotente.

ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "crmTheme" TEXT;
ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "crmFont" TEXT;
