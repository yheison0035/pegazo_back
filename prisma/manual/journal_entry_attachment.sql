-- Documento soporte (factura/recibo) en los asientos manuales.
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;
