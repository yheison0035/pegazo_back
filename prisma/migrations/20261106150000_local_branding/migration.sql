-- Marca/datos propios por local (logo, NIT y correo) que alimentan facturas y
-- correos de confirmación cuando la empresa tiene MÁS de una sede. Si quedan
-- vacíos se cae a los datos de la empresa. Con una sola sede, se usan siempre
-- los de la empresa registrada. Aditivo e idempotente.

ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "nit" TEXT;
ALTER TABLE "Local" ADD COLUMN IF NOT EXISTS "email" TEXT;
