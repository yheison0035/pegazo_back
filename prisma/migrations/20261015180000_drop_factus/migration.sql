-- Retiro de la integración Factus (proveedor tecnológico externo). La
-- facturación electrónica ahora va 100% por la Pegazo Fiscal API propia, y el
-- resultado de emisión se guarda en Sale.eInvoice* (eInvoiceDocId/Number/Status).
-- Estas tablas quedaban sin uso.
DROP TABLE IF EXISTS "ElectronicInvoice";
DROP TABLE IF EXISTS "FactusConfig";
