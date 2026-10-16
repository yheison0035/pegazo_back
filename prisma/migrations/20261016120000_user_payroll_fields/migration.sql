-- Datos de nómina del empleado (cargo y salario) en el usuario, para alimentar
-- la nómina electrónica DIAN desde un solo lugar.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "salary" INTEGER;
