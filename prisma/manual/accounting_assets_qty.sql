-- Activos: cantidad + valor unitario, y vida útil opcional.
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "unitCost" INTEGER;
ALTER TABLE "Asset" ALTER COLUMN "usefulLifeMonths" DROP NOT NULL;
