-- Crédito por cuotas (fiado con plan de pagos): la venta a crédito puede pactar
-- un número de cuotas con su frecuencia, un % de recargo y una cuota inicial.
-- El cronograma vive en "SaleInstallment"; el pagado/pendiente de cada cuota se
-- deriva de los abonos (SalePayment), así que esta tabla no se muta por abono.

-- 1) Enums (idempotentes)
DO $$ BEGIN
    CREATE TYPE "InstallmentFrequency" AS ENUM ('SEMANAL', 'QUINCENAL', 'MENSUAL', 'ANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "InstallmentStatus" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Términos del crédito en la venta
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "creditFrequency" "InstallmentFrequency";
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "creditInstallmentsCount" INTEGER;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "creditInterestPercent" DECIMAL(6,2);
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "creditInterestAmount" DECIMAL(14,2);
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "creditDownPayment" DECIMAL(14,2);
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "creditStartDate" TIMESTAMP(3);

-- 3) Cronograma de cuotas
CREATE TABLE IF NOT EXISTS "SaleInstallment" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "saleId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SaleInstallment_pkey" PRIMARY KEY ("id")
);

-- 4) Índices
CREATE INDEX IF NOT EXISTS "SaleInstallment_saleId_idx" ON "SaleInstallment"("saleId");
CREATE INDEX IF NOT EXISTS "SaleInstallment_companyId_idx" ON "SaleInstallment"("companyId");
CREATE INDEX IF NOT EXISTS "SaleInstallment_dueDate_idx" ON "SaleInstallment"("dueDate");

-- 5) Llave foránea (idempotente): al borrar la venta se borran sus cuotas
DO $$ BEGIN
    ALTER TABLE "SaleInstallment" ADD CONSTRAINT "SaleInstallment_saleId_fkey"
        FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
