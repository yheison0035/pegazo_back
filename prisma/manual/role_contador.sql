-- Fase D: nuevo rol CONTADOR (usuario invitado por el dueño para llevar la
-- contabilidad de su empresa; acceso a la sección Contabilidad).
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CONTADOR';
